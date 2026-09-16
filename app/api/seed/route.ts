import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function POST() {
  try {
    const { stdout, stderr } = await execPromise('npx tsx prisma/seed.ts');
    return NextResponse.json({ message: 'Database reset & re-seeded successfully!', stdout, stderr });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Seed reset failed' }, { status: 500 });
  }
}
