import fs from 'fs';
import path from 'path';

export interface KnowledgeEntry {
  id: string;
  text: string;
  category: string;
  tags: string[];
  userId?: string; // owner scope; 'platform' or missing = global
}

const DEFAULT_KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: "1",
    text: "User: Premium. Action: Locked in a private black car SUV transfer from Truist Park to Southfork Drive with a glowing feedback score.",
    category: "transport",
    tags: ["concierge", "black car", "atlanta", "ride", "uber", "lyft"]
  },
  {
    id: "2",
    text: "User: Premium. Action: Booked tickets for Atlanta Braves vs Mets with Club Level access.",
    category: "tickets",
    tags: ["concierge", "events", "atlanta", "tickets", "braves", "game"]
  },
  {
    id: "3",
    text: "User: Premium. Action: Resolved a WebRTC audio mic permissions block via cache refresh.",
    category: "technical",
    tags: ["support", "webrtc", "mic", "audio", "camera", "error", "reset"]
  },
  {
    id: "4",
    text: "User: Premium. Action: Accepted a custom 3-day Atlanta itinerary with a direct payment checkout.",
    category: "itinerary",
    tags: ["concierge", "itinerary", "atlanta", "plan"]
  },
  {
    id: "5",
    text: "User: Premium. Action: Claimed member offer for the tasting course at The Optimist.",
    category: "offers",
    tags: ["concierge", "offers", "atlanta", "restaurant", "food", "optimist"]
  },
  {
    id: "6",
    "text": "User: Premium. Action: Successfully booked Delta flight from ATL to JFK using IATA resolution.",
    category: "flights",
    tags: ["travel", "flights", "nyc", "tickets", "jfk", "atl"]
  }
];

const getFilePath = () => {
  return path.join(process.cwd(), 'data', 'agent_knowledge_base.json');
};

// Memory fallback to support read-only cloud hosts like Vercel
let inMemoryKnowledge: KnowledgeEntry[] | null = null;

export function getKnowledgeBase(): KnowledgeEntry[] {
  if (inMemoryKnowledge) {
    return inMemoryKnowledge;
  }

  const filePath = getFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      inMemoryKnowledge = JSON.parse(data);
      return inMemoryKnowledge || DEFAULT_KNOWLEDGE;
    }
  } catch (err) {
    console.warn('[FlyDnA Memory] Failed to read knowledge base from disk, falling back to defaults:', err);
  }

  inMemoryKnowledge = [...DEFAULT_KNOWLEDGE];
  return inMemoryKnowledge;
}

export function saveKnowledgeBase(entries: KnowledgeEntry[]) {
  inMemoryKnowledge = entries;
  const filePath = getFilePath();
  try {
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[FlyDnA Memory] Failed to save knowledge base to disk (likely read-only fs):', err);
  }
}

export function addKnowledge(text: string, category: string, tags: string[], userId?: string) {
  const entries = getKnowledgeBase();
  const exists = entries.some(e => e.text.toLowerCase() === text.toLowerCase());
  if (exists) return; // avoid duplicates

  entries.push({
    id: String(Date.now() + Math.floor(Math.random() * 1000)),
    text,
    category,
    tags: tags.map(t => t.toLowerCase()),
    userId: userId || 'platform'
  });
  saveKnowledgeBase(entries);
}

export function searchKnowledge(query: string, limit = 3, userId?: string): string[] {
  const all = getKnowledgeBase();
  const entries = all.filter(e => !e.userId || e.userId === 'platform' || (userId && e.userId === userId));
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\W+/).filter(w => w.length > 2);

  const ranked = entries.map(entry => {
    const textLower = entry.text.toLowerCase();
    let score = 0;

    // Word matching match score
    for (const word of queryWords) {
      if (textLower.includes(word)) {
        score += 2;
      }
    }

    // Tag matching bonus
    for (const tag of entry.tags) {
      if (queryLower.includes(tag)) {
        score += 3;
      }
    }

    // Boost if categories match keywords
    if (queryLower.includes(entry.category)) {
      score += 1;
    }

    return { text: entry.text, score };
  });

  return ranked
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(r => r.text);
}
