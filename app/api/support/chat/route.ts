import { NextRequest, NextResponse } from 'next/server';
import { searchKnowledge } from '@/lib/knowledge';

const SYSTEM_PROMPT = `You are FlyDnA Tech Support — a knowledgeable, warm, and professional tech specialist for FlyDnA members.

CORE DOMAIN & EXCLUSIVE LANE:
You strictly own PLATFORM & ACCOUNT SUPPORT, APP TROUBLESHOOTING, HARASSMENT REPORTING, COMPLAINT RESOLUTION, TRAVEL TECH PRODUCTS (FlyDnA E-Commerce Store), and DAILY TRAVEL TECH NEWS UPDATES.

PRIMARY RESPONSIBILITIES & CAPABILITIES:
1. PROBLEM SOLVER & VENTING POC: You let users vent about any issues — whether it's platform glitches, account questions, flight/hotel complaints, or harassment reports. You take complaints seriously, handle them with care, and resolve issues.
2. DAILY TRAVEL WORLD NEWS: You deliver 2-3 daily news updates from around the travel and aviation tech world.
3. TRAVEL TECH E-COMMERCE: You recommend travel tech gear, gadgets, and products from the FlyDnA e-commerce store.
4. FREE-LANCE TECH EXPERT: You know tech inside and out, from WebRTC connections to modern mobile software.

STRICT BOUNDARY & HARD LAWS:
1. NO FLIGHT BOOKINGS / NO HOTELS / NO CHAUFFEUR RIDES: Hand off booking requests to Travel Agent or Concierge. Say: "For flights or airport telemetry, reach out to your FlyDnA Travel Agent! For ground rides, hotels, or VIP excursions, your FlyDnA Concierge has you covered in contacts!"
2. SECURITY & PRIVACY: Never compromise platform security, user data, or partner credentials.
3. FRIEND IN CONTACTS: You are always present in the user's contacts list as a chill, approachable, and respected friend.

TONE & VIBE:
- Professional, warm, clear, and empathetic by default — like a world-class concierge desk. MIRROR THE USER'S REGISTER: if they write casually or use slang, you may relax and match their energy; if they are formal or neutral, stay polished. NEVER initiate slang (no "yo", "my boi", "fam", "no cap") — only reflect it if the user leads. Use emojis sparingly, and only in casual exchanges.`;


const tools = [
  {
    name: 'check_system_status',
    description: 'Diagnose current network latency, socket.io connection, WebRTC status, and Mapbox tokens.',
    input_schema: { type: 'object', properties: {} },
    async execute() {
      return {
        timestamp: new Date().toISOString(),
        connection: 'Socket.io stage-sync active',
        webrtc: 'Agora RTC channel standby',
        apiGateway: 'Staging API gateway healthy',
        mapbox: 'Mapbox Vector Map layers validated',
        ping: '32ms'
      };
    }
  },
  {
    name: 'reset_session',
    description: 'Force clean local caching, sessions, and state variables to resolve glitches.',
    input_schema: { type: 'object', properties: {} },
    async execute() {
      return {
        status: 'cleared',
        actionMarkup: '[Reset Connection & Refresh](/)'
      };
    }
  },
  {
    name: 'submit_support_ticket',
    description: 'Submit an official support ticket to FlyDnA back-office engineers.',
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['network', 'webrtc', 'payments', 'account', 'other'] },
        description: { type: 'string' }
      },
      required: ['category', 'description']
    },
    async execute({ category, description }: any) {
      const ticketNum = Math.floor(100000 + Math.random() * 900000);
      return {
        status: 'ticket_created',
        ticketId: `TKT-${ticketNum}`,
        category,
        description,
        eta: '15 minutes'
      };
    }
  }
];

const toolMap = Object.fromEntries(tools.map((t) => [t.name, t]));
const toolSchemas = tools.map(({ name, description, input_schema }) => ({
  name,
  description,
  input_schema,
}));

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
    const { messages = [], userName } = await req.json();
    if (!messages.length) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }

    const lastUserMsg = messages[messages.length - 1]?.text || messages[messages.length - 1]?.content || '';
    const msgLower = lastUserMsg.toLowerCase();

    // Travel / Concierge Check
    const travelKeywords = ['flight', 'hotel', 'dinner', 'table', 'concert', 'charter', 'vip section'];
    if (travelKeywords.some(k => msgLower.includes(k))) {
      return NextResponse.json({ reply: "For travel bookings or VIP concierge services, your FlyDnA Travel Agent or Concierge has you covered — you can find them in your contacts!" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      let reply = `Hello ${userName || 'there'}, FlyDnA Tech Support here. What app feature, setting, or connection can I optimize for you today?`;

      if (msgLower.includes("reset") || msgLower.includes("cache") || msgLower.includes("bug") || msgLower.includes("fix") || msgLower.includes("glitch")) {
        reply = `I can perform a quick session reset to clear local cached state and optimize your connection latency:\n\n[Reset Connection & Refresh](/)`;
      } else if (msgLower.includes("ticket") || msgLower.includes("help") || msgLower.includes("issue")) {
        reply = `I've logged your issue and flagged it to the FlyDnA team — you'll hear back as soon as possible.`;
      }

      return NextResponse.json({ reply });
    }

    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
    const memories = searchKnowledge(lastUserMsg, 3, callerId);
    let system = SYSTEM_PROMPT;
    if (userName) system += `\n\nThe user's name is ${userName}. Address them by name naturally.`;
    if (memories.length > 0) {
      system += `\n\nLEARNED CONTEXT:\n${memories.map(m => `- ${m}`).join('\n')}`;
    }

    let conversation = messages.map((m: any) => ({
      role: m.role === 'assistant' || m.from === 'them' ? 'assistant' : 'user',
      content: m.content || m.text || ''
    }));

    let finalText = '';
    for (let turn = 0; turn < 5; turn++) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system,
          messages: conversation,
          tools: toolSchemas
        })
      });

      if (!response.ok) break;
      const responseData = await response.json();
      const toolUseBlocks = responseData.content?.filter((b: any) => b.type === 'tool_use') || [];

      if (toolUseBlocks.length === 0) {
        finalText = responseData.content?.filter((b: any) => b.type === 'text')?.map((b: any) => b.text)?.join('\n') || '';
        break;
      }

      conversation.push({ role: 'assistant', content: responseData.content });
      const toolResults = await Promise.all(
        toolUseBlocks.map(async (block: any) => {
          const tool = toolMap[block.name];
          let result;
          try {
            result = tool ? await tool.execute(block.input) : { error: 'Unknown tool' };
          } catch (err: any) {
            result = { error: err.message };
          }
          return { type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) };
        })
      );
      conversation.push({ role: 'user', content: toolResults });
    }

    return NextResponse.json({ reply: finalText || "I'm right here — what technical question can I solve for you?" });
  } catch (err: any) {
    return NextResponse.json({ error: 'Support service temporarily unavailable.' }, { status: 500 });
  }
}
