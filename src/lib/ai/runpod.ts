import { unstable_cache } from "next/cache";

/**
 * Generic client for RunPod Serverless endpoints
 */

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;

export class RunPodError extends Error {
    constructor(message: string, public status?: number, public details?: any) {
        super(message);
        this.name = "RunPodError";
    }
}

type RunPodInput = {
    prompt?: string;
    messages?: Array<{ role: string; content: string }>;
    [key: string]: any;
};

// Simple in-memory cache for development/MVP
// In production, use Redis or Next.js Data Cache
const responseCache = new Map<string, any>();

async function pollStatus(endpointId: string, requestId: string): Promise<any> {
    const url = `https://api.runpod.ai/v2/${endpointId}/status/${requestId}`;

    // Poll every 2 seconds, up to 10 minutes? RunPod timeout is usually longer.
    // Let's try 30 attempts * 5 seconds = 150 seconds.
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s

        const response = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${RUNPOD_API_KEY}`,
            },
        });

        if (!response.ok) {
            console.warn(`[RunPod] Poll failed: ${response.status}`);
            continue;
        }

        const data = await response.json();
        console.log(`[RunPod] Poll status: ${data.status}`);

        if (data.status === "COMPLETED") {
            return data.output;
        } else if (data.status === "FAILED") {
            throw new RunPodError("RunPod execution failed during polling", 500, data.error);
        }
        // If IN_QUEUE or IN_PROGRESS, continue
    }

    throw new RunPodError("RunPod execution timed out while polling");
}

async function fetchRunPod(endpointId: string, input: RunPodInput) {
    if (!RUNPOD_API_KEY) {
        throw new RunPodError("RUNPOD_API_KEY is not set");
    }

    // Try runsync first (waits up to 90s usually)
    const url = `https://api.runpod.ai/v2/${endpointId}/runsync`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${RUNPOD_API_KEY}`,
            },
            body: JSON.stringify({ input }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new RunPodError(`RunPod API failed: ${response.status}`, response.status, errorText);
        }

        const data = await response.json();
        console.log(`[RunPod] Raw response for ${endpointId}:`, JSON.stringify(data, null, 2));

        if (data.status === "FAILED") {
            throw new RunPodError("RunPod execution failed", 500, data.error);
        }

        // Handle Queueing (if it returns IN_QUEUE, output might be undefined)
        if (data.status === "IN_QUEUE" || data.status === "IN_PROGRESS") {
            console.log(`[RunPod] Request queued (ID: ${data.id}). Switching to polling...`);
            return await pollStatus(endpointId, data.id);
        }

        return data.output;
    } catch (error) {
        console.error(`[RunPod] Error calling ${endpointId}:`, error);
        throw error;
    }
}

/**
 * Calls a RunPod endpoint with caching
 */
export async function callRunPod(
    endpointId: string,
    input: RunPodInput,
    cacheKey?: string
): Promise<any> {
    if (cacheKey && responseCache.has(cacheKey)) {
        console.log(`[RunPod] Cache hit for ${cacheKey}`);
        return responseCache.get(cacheKey);
    }

    console.log(`[RunPod] Calling ${endpointId}...`);
    const result = await fetchRunPod(endpointId, input);

    if (cacheKey) {
        responseCache.set(cacheKey, result);
    }

    return result;
}
