export function getBotReply(contactId: number, userMessage: string): string {
  const msg = userMessage.toLowerCase();

  if (contactId === 1) {
    // Emma Watson
    if (msg.includes("meet") || msg.includes("where") || msg.includes("spot")) {
      return "How about our usual spot? ☕";
    }
    if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
      return "Hey there! Ready to explore? ✈️";
    }
    if (msg.includes("time") || msg.includes("when")) {
      return "I can make it around 10:00 AM tomorrow!";
    }
    return "That sounds wonderful! Let's lock in the coordinates on the map. 🗺️";
  }

  if (contactId === 2) {
    // Liam Johnson
    if (msg.includes("hi") || msg.includes("hello") || msg.includes("hey")) {
      return "Hey! Just coding up some new route updates.";
    }
    if (msg.includes("code") || msg.includes("work")) {
      return "Almost done with the interface refactoring, it looks sleek!";
    }
    if (msg.includes("test")) {
      return "Tests are all green! Let's deploy 🚀";
    }
    return "Got it! Let me run that through the compiler and check.";
  }

  if (contactId === 3) {
    // Olivia Davis
    if (msg.includes("hi") || msg.includes("hello") || msg.includes("hey")) {
      return "Hello! Hope you're having a great day.";
    }
    if (msg.includes("meet") || msg.includes("coffee")) {
      return "Yes, let's catch up tomorrow over espresso!";
    }
    if (msg.includes("flight") || msg.includes("route")) {
      return "I checked the path and weather, it's clear sky!";
    }
    return "Interesting, let me verify that and get back to you soon.";
  }

  if (contactId === 5) {
    // Ava Brown
    if (msg.includes("hi") || msg.includes("hello") || msg.includes("hey")) {
      return "Hi.";
    }
    if (msg.includes("where") || msg.includes("coordinates")) {
      return "Sharing my live coordinates now.";
    }
    return "Received. I will update the tracker accordingly.";
  }

  if (contactId === 101) {
    // FlyDnA Concierge
    if (msg.includes("hello") || msg.includes("hi") || msg.includes("concierge")) {
      return "Greetings! I am your FlyDnA Concierge. How may I elevate your travel experience today?";
    }
    if (msg.includes("hotel") || msg.includes("stay") || msg.includes("restaurant")) {
      return "I can secure reservations at our premium partner hotels and five-star locations immediately.";
    }
    return "Of course. Your request has been logged. Let me arrange that for you right away.";
  }

  if (contactId === 102) {
    // FlyDnA Travel Agent
    if (msg.includes("hello") || msg.includes("hi") || msg.includes("agent")) {
      return "Hello! FlyDnA Travel Desk here. Are we looking to book new flights or adjust an itinerary?";
    }
    if (msg.includes("deal") || msg.includes("flight") || msg.includes("price")) {
      return "We have exclusive routes active right now. Check the Calendar widget for green deal indicators!";
    }
    return "Let me check availability on the main server for that route. One moment.";
  }

  if (contactId === 103) {
    // FlyDnA Tech Support
    if (msg.includes("hello") || msg.includes("hi") || msg.includes("help") || msg.includes("support")) {
      return "FlyDnA Tech Support. System status: Green. Please describe the technical issue you are experiencing.";
    }
    if (msg.includes("key") || msg.includes("secure") || msg.includes("network")) {
      return "Encrypted channels are fully operational. Hash signatures are active and broadcast lines are secure.";
    }
    return "Diagnostic signal sent. Standard response protocol active. System logging is enabled.";
  }

  return "Interesting! Let's keep exploring.";
}
