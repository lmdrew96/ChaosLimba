import { NextRequest, NextResponse } from 'next/server';
import { evaluateWorkshopResponse } from '@/lib/ai/workshop';
import type { WorkshopChallenge } from '@/lib/ai/workshop';

// Allowed feature keys for demo challenges — reject anything else
const DEMO_FEATURE_KEYS = new Set([
  'past_tense_perfect_compus',
  'formal_informal_address',
  'definite_article',
  'subjunctive_sa',
  'dative_case',
  'possessive_agreement',
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { challenge, response } = body as {
      challenge: WorkshopChallenge;
      response: string;
    };

    if (!challenge || !response?.trim()) {
      return NextResponse.json(
        { error: 'Missing required fields: challenge, response' },
        { status: 400 }
      );
    }

    // Only allow demo-specific feature keys
    if (!DEMO_FEATURE_KEYS.has(challenge.featureKey)) {
      return NextResponse.json(
        { error: 'Invalid demo challenge' },
        { status: 400 }
      );
    }

    // Evaluate at A2 level (demo default)
    const evaluation = await evaluateWorkshopResponse(challenge, response.trim(), 'A2');

    return NextResponse.json({ evaluation });
  } catch (error) {
    console.error('[Demo Evaluate API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate response' },
      { status: 500 }
    );
  }
}
