import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getAdaptationProfile, buildFossilizationAlerts } from '@/lib/ai/adaptation'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const profile = await getAdaptationProfile(userId)
    const fossilizationAlerts = buildFossilizationAlerts(profile)

    return NextResponse.json({
      highestTier: profile.highestTier,
      fossilizationAlerts,
      fossilizingPatterns: profile.fossilizingPatterns.map(p => `${p.errorType}: ${p.category}`),
    })
  } catch (error) {
    console.error('Failed to fetch adaptation profile:', error)
    return NextResponse.json(
      { highestTier: 0, fossilizationAlerts: [], fossilizingPatterns: [] },
      { status: 200 }
    )
  }
}
