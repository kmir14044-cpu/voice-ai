import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

// Mock Database / State
const TRAVEL_DATA = {
  flights: [
    {
      id: "F1",
      destination: "Paris",
      price: 450,
      time: "10:00 AM",
    },
    {
      id: "F2",
      destination: "Tokyo",
      price: 850,
      time: "2:00 PM",
    },
    {
      id: "F3",
      destination: "New York",
      price: 300,
      time: "8:00 AM",
    },
  ],

  hotels: [
    {
      id: "H1",
      name: "Grand Royale",
      location: "Paris",
      price: 200,
    },
    {
      id: "H2",
      name: "Zen Garden",
      location: "Tokyo",
      price: 150,
    },
    {
      id: "H3",
      name: "Skyline Suite",
      location: "New York",
      price: 250,
    },
  ],

  bookings: [] as any[],
};

export default async function handler(
  req: any,
  res: any
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { message, history } = req.body;

    // Convert old history format
    const formattedHistory =
      (history || []).map((msg: any) => ({
        role:
          msg.role === "model"
            ? "assistant"
            : msg.role,
        content:
          msg.parts?.[0]?.text ||
          msg.content ||
          "",
      }));

    // Search Logic
    let searchResults = "";

    const lowerMessage =
      message.toLowerCase();

    const destinations = [
      "paris",
      "tokyo",
      "new york",
    ];

    const foundLocation =
      destinations.find((city) =>
        lowerMessage.includes(city)
      );

    if (
      lowerMessage.includes("flight") ||
      lowerMessage.includes("hotel") ||
      lowerMessage.includes("travel")
    ) {
      const flights =
        TRAVEL_DATA.flights.filter(
          (f) =>
            !foundLocation ||
            f.destination.toLowerCase() ===
              foundLocation
        );

      const hotels =
        TRAVEL_DATA.hotels.filter(
          (h) =>
            !foundLocation ||
            h.location.toLowerCase() ===
              foundLocation
        );

      searchResults = `
Available Travel Data:

Flights:
${JSON.stringify(flights, null, 2)}

Hotels:
${JSON.stringify(hotels, null, 2)}
`;
    }

    const completion =
      await groq.chat.completions.create({
        model:
          "llama-3.1-8b-instant",

        temperature: 0.7,

        messages: [
          {
            role: "system",
            content: `
You are Voyager, a sophisticated AI travel assistant.

You help users:
- Book flights
- Find hotels
- Travel planning
- Customer support

Current travel database:
${JSON.stringify(TRAVEL_DATA)}

${searchResults}

If the user asks about travel,
use the provided travel data.

Be conversational and professional.
`,
          },

          ...formattedHistory,

          {
            role: "user",
            content: message,
          },
        ],
      });

    const response =
      completion.choices[0]?.message
        ?.content;

    return res.status(200).json({
      text:
        response ||
        "Sorry, I could not respond.",
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      error: error.message,
    });
  }
}