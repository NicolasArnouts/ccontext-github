import { NextResponse } from 'next/server'
import { TempEnvManager } from '@/lib/temp-env-manager'

const tempEnvManager = new TempEnvManager();

export async function POST(req: Request) {
  try {
    await tempEnvManager.cleanupExpiredEnvironments();
    return NextResponse.json({ message: 'Cleanup completed successfully' })
  } catch (error) {
    console.error('Error during cleanup:', error)
    return NextResponse.json({ error: 'An error occurred during cleanup' }, { status: 500 })
  }
}