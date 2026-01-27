import { NextResponse } from 'next/server';
import { analyzeGrammar } from '@/lib/ai/grammar';
import { compareSemanticSimilarity } from '@/lib/ai/spamA';
import { checkIntonationShift } from '@/lib/ai/spamD';
import { callGroq } from '@/lib/ai/groq';

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs?: number;
  error?: string;
  lastChecked: string;
}

interface HealthReport {
  timestamp: string;
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    grammar: ComponentHealth;
    spamA: ComponentHealth;
    spamD: ComponentHealth;
    groq: ComponentHealth;
  };
}

async function testGrammarHealth(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    const result = await analyzeGrammar("Test");
    const latency = Date.now() - start;

    return {
      status: result.correctedText !== undefined ? 'healthy' : 'degraded',
      latencyMs: latency,
      lastChecked: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      error: error.message,
      latencyMs: Date.now() - start,
      lastChecked: new Date().toISOString()
    };
  }
}

async function testSpamAHealth(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    const result = await compareSemanticSimilarity("Bună", "Salut");
    const latency = Date.now() - start;

    // If using Levenshtein fallback, mark as degraded
    const status = result.fallbackMethod === 'levenshtein' ? 'degraded' : 'healthy';

    return {
      status,
      latencyMs: latency,
      lastChecked: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      error: error.message,
      latencyMs: Date.now() - start,
      lastChecked: new Date().toISOString()
    };
  }
}

async function testSpamDHealth(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    // SPAM-D is local lookup, should always work
    const result = checkIntonationShift("test", []);
    const latency = Date.now() - start;

    return {
      status: 'healthy',
      latencyMs: latency,
      lastChecked: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      error: error.message,
      latencyMs: Date.now() - start,
      lastChecked: new Date().toISOString()
    };
  }
}

async function testGroqHealth(): Promise<ComponentHealth> {
  const start = Date.now();

  if (!process.env.GROQ_API_KEY) {
    return {
      status: 'unhealthy',
      error: 'GROQ_API_KEY not configured',
      lastChecked: new Date().toISOString()
    };
  }

  try {
    const result = await callGroq([
      { role: 'system', content: 'You are a test. Respond with JSON format: {"status": "ok"}' },
      { role: 'user', content: 'Health check - respond in JSON' }
    ]);
    const latency = Date.now() - start;

    return {
      status: result ? 'healthy' : 'degraded',
      latencyMs: latency,
      lastChecked: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      error: error.message,
      latencyMs: Date.now() - start,
      lastChecked: new Date().toISOString()
    };
  }
}

export async function GET() {
  try {
    // Run all health checks in parallel
    const [grammar, spamA, spamD, groq] = await Promise.all([
      testGrammarHealth(),
      testSpamAHealth(),
      testSpamDHealth(),
      testGroqHealth()
    ]);

    const components = { grammar, spamA, spamD, groq };

    // Determine overall health
    const statuses = Object.values(components).map(c => c.status);
    const hasUnhealthy = statuses.includes('unhealthy');
    const hasDegraded = statuses.includes('degraded');

    const overall = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';

    const report: HealthReport = {
      timestamp: new Date().toISOString(),
      overall,
      components
    };

    // Return 503 if unhealthy, 200 otherwise
    const statusCode = overall === 'unhealthy' ? 503 : 200;

    return NextResponse.json(report, { status: statusCode });
  } catch (error: any) {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        overall: 'unhealthy',
        error: error.message
      },
      { status: 503 }
    );
  }
}
