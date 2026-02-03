import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDashboardStats, getRecentActivity, getFeaturesDiscoveredCount } from '@/lib/db/queries';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [stats, recentActivity, featuresDiscovered] = await Promise.all([
      getDashboardStats(userId),
      getRecentActivity(userId, 5),
      getFeaturesDiscoveredCount(userId),
    ]);

    return NextResponse.json({ stats: { ...stats, featuresDiscovered }, recentActivity });
  } catch (error) {
    console.error('[API] Failed to fetch dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
