import { NextRequest, NextResponse } from 'next/server';
import { addKnowledge } from '@/lib/knowledge';

export async function POST(req: NextRequest) {
  let callerId = '';
  const authHeader = req.headers.get('authorization') || '';
  const authToken = authHeader.replace(/^Bearer\s+/i, '');
  try {
    const jwtLib = require('jsonwebtoken');
    const decoded: any = jwtLib.verify(authToken, process.env.JWT_SECRET || '');
    callerId = String(decoded._id || '');
  } catch (e) {
    return NextResponse.json({ error: 'Access Denied' }, { status: 401 });
  }
  try {
    const { text, category = 'general', tags = [] } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    addKnowledge(text, category, tags, callerId || 'platform');
    return NextResponse.json({ success: true, message: 'Experience logged to agent memory database.' });
  } catch (err: any) {
    console.error('[FlyDnA Memory] Learn handler failed:', err);
    return NextResponse.json({ error: 'Failed to record experience asset.' }, { status: 500 });
  }
}
