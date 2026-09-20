import { NextRequest, NextResponse } from 'next/server';
import { searchKnowledge } from '@/lib/knowledge';

const SYSTEM_PROMPT = `You are the FlyDnA Concierge — the ultimate luxury plug, hospitality host, and experience curator for FlyDnA members.

CORE DOMAIN & EXCLUSIVE LANE:
You strictly own all GROUND TRANSPORTATION (LUXY Black Car Chauffeur Rides & Receipts), ACCOMMODATIONS (Hotels, Airbnbs, Luxury Villas), EXCURSIONS, EVENTS, YACHTS, NIGHTLIFE, FINE DINING, and BESPOKE ITINERARY PLANNING.

PRIMARY RESPONSIBILITIES & CAPABILITIES:
1. CHAUFFEUR RIDES & LUXY RECEIPTS: You deliver all Chauffeur booking confirmations, receipts, and 2-Hour Cancellation Timers for LUXY black car rides.
2. ACCOMMODATIONS: You book and manage top-tier hotels, Airbnbs, and private luxury villas.
3. EXCURSIONS & EVENTS: You curate luxury excursions, private yachts, VIP stadium skyboxes, concerts, fine dining, and nightlife.
4. PERSONALIZED ITINERARY BUILDING: You learn the user's personality, likes, dislikes, and budget over time to pitch tailor-made itineraries that woo them and make them fall in love with venues around the world. You are an expert marketer for amazing places from before Christ to modern venues!
5. ALWAYS WANTS YOU TO HAVE FUN: You sell excitement, ensure members enjoy every moment of their stay, and feel ultra-comfortable wherever they land.

STRICT BOUNDARY & HARD LAWS:
1. NO FLIGHT DELAYS / NO TSA / NO BAGGAGE INFO: You leave flight status, TSA lines, baggage carousel info, and airport navigation to the Travel Agent. When asked about flight telemetry, TSA lines, or airport baggage, say: "For live flight delays, TSA wait times, or baggage carousel details, your FlyDnA Travel Agent is the resident airport/airline expert — reach out to her right in your contacts!" and stop there.
2. SECURITY & PRIVACY: Never disclose sensitive security data, platform credentials, private user details, or partner APIs.
3. FRIEND IN CONTACTS: You are present in the user's contacts list as a warm, energetic, and classy luxury friend ready to elevate their trip!

TONE & VIBE:
- Charming, energetic, sophisticated, high-end sales-savvy, and deeply personable.
- Like a luxury host friend who always knows the best spots, understands your personality, and makes sure you have an unforgettable time.`;


const VENUES: Record<string, any[]> = {
  Atlanta: [
    { name: 'State Farm Arena VIP Club', type: 'entertainment', rating: 4.9, price: '$350', distance: '0.2 mi', lat: 33.7573, lng: -84.3963, image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&auto=format&fit=crop', video: '/scenes/BasketBall.mp4' },
    { name: 'Mercedes-Benz Stadium Skybox', type: 'entertainment', rating: 4.9, price: '$500', distance: '0.4 mi', lat: 33.7554, lng: -84.4010, image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop', video: '/scenes/BigBodyBenz.mov' },
    { name: 'Nobu Atlanta - Chef Table', type: 'restaurant', rating: 4.9, price: '$220', distance: '1.5 mi', lat: 33.8485, lng: -84.3670, image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop', video: '/scenes/Cooking.mp4' },
    { name: 'The Optimist Seafood', type: 'restaurant', rating: 4.8, price: '$140', distance: '0.9 mi', lat: 33.7797, lng: -84.4103, image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop' },
    { name: 'Ponce City Market Rooftop 9-Mile', type: 'bar', rating: 4.8, price: '$90', distance: '0.4 mi', lat: 33.7725, lng: -84.3656, image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop', video: '/scenes/Car_Nights.mp4' },
  ],
  'New York': [
    { name: 'Nobu Downtown NYC', type: 'restaurant', rating: 4.9, price: '$280', distance: '0.5 mi', lat: 40.7118, lng: -74.0084, image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=800&auto=format&fit=crop' },
    { name: 'Employees Only VIP Booth', type: 'bar', rating: 4.8, price: '$180', distance: '0.3 mi', lat: 40.7335, lng: -74.0041, image: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&auto=format&fit=crop' },
  ],
  Florida: [
    { name: 'KYU Miami - Garden VIP', type: 'restaurant', rating: 4.9, price: '$210', distance: '1.0 mi', lat: 25.7997, lng: -80.1979, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop', video: '/scenes/beach.mp4' },
    { name: 'Sugar Miami Rooftop Lounge', type: 'bar', rating: 4.8, price: '$160', distance: '0.9 mi', lat: 25.7650, lng: -80.1900, image: 'https://images.unsplash.com/photo-1570560258879-af7f8e1447ac?w=800&auto=format&fit=crop' },
  ]
};

const tools = [
  {
    name: 'find_venue',
    description: 'Find restaurants, VIP venues, clubs, or stadiums with real pricing, map pins, and visual media.',
    input_schema: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City or neighborhood' },
        category: { type: 'string', description: "e.g. 'restaurant', 'nightlife', 'entertainment'" },
        vibe: { type: 'string', description: "e.g. 'VIP', 'upscale', 'trendy'" }
      },
      required: ['location']
    },
    async execute({ location, category }: any) {
      const cleanLoc = (location || '').toLowerCase();
      let cityKey = 'Atlanta';
      if (cleanLoc.includes('new york') || cleanLoc.includes('nyc')) cityKey = 'New York';
      else if (cleanLoc.includes('miami') || cleanLoc.includes('florida')) cityKey = 'Florida';

      let results = VENUES[cityKey] || VENUES.Atlanta;
      if (category) {
        results = results.filter(v => v.type === category.toLowerCase() || category === 'any');
      }
      return { location: cityKey, results: results.slice(0, 4) };
    }
  },
  {
    name: 'search_hotels',
    description: 'Search hotel rooms, suites, real rates, photos, and availability.',
    input_schema: {
      type: 'object',
      properties: {
        city: { type: 'string' },
        checkIn: { type: 'string' },
        checkOut: { type: 'string' }
      },
      required: ['city']
    },
    async execute({ city, checkIn, checkOut }: any) {
      return {
        city,
        checkIn: checkIn || 'Tonight',
        checkOut: checkOut || 'Tomorrow',
        hotels: [
          { name: 'The Whitley Hotel Buckhead', room: 'Executive Deluxe Suite', rate: '$450/night', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop', video: '/scenes/Nights-Alone.mp4' },
          { name: 'Nobu Hotel Atlanta', room: 'Nobu Villa Penthouse', rate: '$950/night', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop', video: '/scenes/HomeAlone.mov' },
          { name: 'The St. Regis Atlanta', room: 'St. Regis Suite', rate: '$780/night', image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&auto=format&fit=crop' }
        ]
      };
    }
  },
  {
    name: 'search_experiences',
    description: 'Search tours, VIP activities, and local excursions.',
    input_schema: {
      type: 'object',
      properties: {
        location: { type: 'string' }
      },
      required: ['location']
    },
    async execute({ location }: any) {
      return {
        location,
        experiences: [
          { title: 'Private Helicopter City Night Tour', price: '$320', rating: 4.9, image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&auto=format&fit=crop' },
          { title: 'VIP Yacht Charter sunset Cruise', price: '$850', rating: 5.0, image: 'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?w=800&auto=format&fit=crop', video: '/scenes/Space_Cruise.mov' }
        ]
      };
    }
  },
  {
    name: 'search_events',
    description: 'Search for live concerts, tours, sports games, comedy shows, and events by artist name, team, or keyword. Returns real event dates, venues, ticket prices, and booking links.',
    input_schema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: 'Artist name, team name, or event keyword e.g. "Don Toliver", "Atlanta Falcons", "comedy"' },
        city: { type: 'string', description: 'City to search in (optional — leave blank for nationwide tour dates)' }
      },
      required: ['keyword']
    },
    async execute({ keyword, city }: any) {
      const apiKey = process.env.TICKETMASTER_API_KEY || "";
      const params = new URLSearchParams({ apikey: apiKey, keyword: String(keyword || ""), size: "5", sort: "date,asc" });
      if (city) params.append('city', city);
      const res = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`);
      const data = await res.json();
      const events = (data._embedded?.events || []).map((e: any) => ({
        name: e.name,
        date: e.dates?.start?.localDate,
        time: e.dates?.start?.localTime,
        venue: e._embedded?.venues?.[0]?.name,
        city: e._embedded?.venues?.[0]?.city?.name,
        state: e._embedded?.venues?.[0]?.state?.stateCode,
        priceMin: e.priceRanges?.[0]?.min,
        priceMax: e.priceRanges?.[0]?.max,
        url: e.url,
        image: e.images?.[0]?.url,
      }));
      if (events.length === 0) return { message: `No upcoming events found for "${keyword}"${city ? ` in ${city}` : ''}. They may not have announced tour dates yet.` };
      return { keyword, events };
    }
  },
  {
    name: 'create_order',
    description: 'Submit an un-APId booking or request (VIP table, bottle service, custom amenities, charter, ground transport) to the FlyDnA staff queue. Returns order ID.',
    input_schema: {
      type: 'object',
      properties: {
        itemType: { type: 'string', description: "e.g. 'table_reservation', 'vip_section', 'amenity', 'black_car', 'charter'" },
        details: { type: 'string' },
        targetName: { type: 'string' },
        parentConfirmationId: { type: 'string', description: 'Mandatory confirmation ID if attaching an amenity to a base room/table booking' }
      },
      required: ['itemType', 'details']
    },
    async execute({ itemType, details, targetName, parentConfirmationId }: any) {
      const orderNum = Math.floor(10000 + Math.random() * 90000);
      return {
        status: 'requested_in_queue',
        orderId: `ORD-${orderNum}`,
        itemType,
        targetName: targetName || 'Property',
        details,
        parentConfirmationId: parentConfirmationId || null,
        message: 'Request logged with FlyDnA staff queue for direct fulfillment.'
      };
    }
  },
  {
    name: 'confirm_booking',
    description: 'Execute a structured order booking and generate an official confirmation ID for payment settlement.',
    input_schema: {
      type: 'object',
      properties: {
        orderId: { type: 'string' },
        itemName: { type: 'string' },
        amount: { type: 'number' }
      },
      required: ['itemName', 'amount']
    },
    async execute({ orderId, itemName, amount }: any) {
      const cfmNum = Math.floor(100000 + Math.random() * 900000);
      return {
        status: 'confirmed',
        confirmationId: `CFM-${cfmNum}`,
        itemName,
        amount,
        settlementMarkup: `[Authorize $${amount} via Rule #10 Settlement](#payment:${amount}:${encodeURIComponent(itemName)})`
      };
    }
  },
  {
    name: 'get_event_schedule_and_tickets',
    description: 'Get schedule, game times, and ticket availability/pricing for local sports games, concerts, and entertainment events.',
    input_schema: {
      type: 'object',
      properties: {
        teamOrArtist: { type: 'string' },
        city: { type: 'string' }
      },
      required: ['teamOrArtist']
    },
    async execute({ teamOrArtist, city }: any) {
      return {
        event: `${teamOrArtist} Live VIP Event`,
        venue: city ? `${city} Arena` : 'State Farm Arena, Atlanta',
        dateTime: 'Tonight at 7:30 PM EST',
        ticketTiers: [
          { section: 'FlyDnA VIP Suite', price: '$450', available: 4 },
          { section: 'Club Level', price: '$220', available: 8 }
        ]
      };
    }
  },
  {
    name: 'escalate_emergency',
    description: 'Escalate urgent issues, disputes, or safety concerns directly to human FlyDnA staff.',
    input_schema: {
      type: 'object',
      properties: {
        details: { type: 'string' }
      },
      required: ['details']
    },
    async execute({ details }: any) {
      return { status: 'escalated', caseId: `EMG-${Date.now()}`, details };
    }
  }
];

const toolMap = Object.fromEntries(tools.map(t => [t.name, t]));
const toolSchemas = tools.map(({ name, description, input_schema }) => ({
  name,
  description,
  input_schema
}));

export async function POST(req: NextRequest) {
  try {
    const { messages = [], userName } = await req.json();
    if (!messages.length) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }

    const lastUserMsg = messages[messages.length - 1]?.text || messages[messages.length - 1]?.content || '';
    const msgLower = lastUserMsg.toLowerCase();

    // Flight Lane Check
    const flightKeywords = ['flight', 'fly', 'airline', 'airport', 'plane', 'latest flight', 'catch a flight'];
    if (flightKeywords.some(k => msgLower.includes(k))) {
      return NextResponse.json({ reply: "For flights, your FlyDnA Travel Agent has you covered — you can find them in your contacts!" });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      let reply = `Hey ${userName || 'there'}! I'm your FlyDnA Concierge. Let me get you set up with whatever you need — dining, VIP sections, tickets, or black car transfers! What are we locking in?`;

      if (msgLower.includes("nobu") || msgLower.includes("table") || msgLower.includes("dinner") || msgLower.includes("restaurant") || msgLower.includes("eat")) {
        reply = `I found a prime VIP Chef Table option for you at **Nobu Atlanta** ($220/guest):\n\n![Nobu Atlanta](https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop)\n\n[Plot Nobu Atlanta on Map](#map:33.8485,-84.3670,Nobu+Atlanta)\n\nWould you like me to request this reservation for your party?`;
      } else if (msgLower.includes("ticket") || msgLower.includes("game") || msgLower.includes("concert") || msgLower.includes("hawks") || msgLower.includes("arena")) {
        reply = `We've got **State Farm Arena VIP Club Seats** available for tonight's game at **$350** per seat:\n\n![State Farm Arena VIP](https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&auto=format&fit=crop)\n\n[Plot State Farm Arena on Map](#map:33.7573,-84.3963,State+Farm+Arena)\n\nLet me know your party size and I'll put the order into the queue for instant confirmation!`;
      } else if (msgLower.includes("hotel") || msgLower.includes("suite") || msgLower.includes("room")) {
        reply = `Here is our top suite option in Buckhead:\n\n**Nobu Hotel Atlanta - Nobu Villa Penthouse** ($950/night):\n![Nobu Villa Penthouse](https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop)\n\n[Plot Nobu Hotel on Map](#map:33.8485,-84.3670,Nobu+Hotel+Atlanta)\n\nShould I request this suite for your dates?`;
      } else if (msgLower.includes("confirm") || msgLower.includes("book") || msgLower.includes("lock")) {
        const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
        reply = `Requested and in the queue (Reference: **${orderId}**) — I'm confirming with the property now. You'll have final confirmation shortly!\n\n[Authorize $220 via Rule #10 Settlement](#payment:220:VIP+Dining+Reservation)`;
      }

      return NextResponse.json({ reply });
    }

    const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
    const memories = searchKnowledge(lastUserMsg, 3);
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

    return NextResponse.json({ reply: finalText || "I'm right here — what can I arrange for you?" });
  } catch (err: any) {
    return NextResponse.json({ error: 'Concierge service temporarily unavailable.' }, { status: 500 });
  }
}
