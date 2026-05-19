import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Mock Database / State
const TRAVEL_DATA = {
  flights: [
    { id: "F1", destination: "Paris", price: 450, time: "10:00 AM" },
    { id: "F2", destination: "Tokyo", price: 850, time: "2:00 PM" },
    { id: "F3", destination: "New York", price: 300, time: "8:00 AM" },
  ],
  hotels: [
    { id: "H1", name: "Grand Royale", location: "Paris", price: 200 },
    { id: "H2", name: "Zen Garden", location: "Tokyo", price: 150 },
    { id: "H3", name: "Skyline Suite", location: "New York", price: 250 },
  ],
  bookings: [] as any[],
};

// Gemini Functions
const bookTravelFunction: FunctionDeclaration = {
  name: "bookTravel",
  parameters: {
    type: Type.OBJECT,
    properties: {
      type: {
        type: Type.STRING,
        enum: ["flight", "hotel"],
      },
      itemId: {
        type: Type.STRING,
      },
      customerName: {
        type: Type.STRING,
      },
    },
    required: ["type", "itemId", "customerName"],
  },
};

const searchTravelFunction: FunctionDeclaration = {
  name: "searchTravel",
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: {
        type: Type.STRING,
      },
      type: {
        type: Type.STRING,
        enum: ["flight", "hotel", "both"],
      },
    },
    required: ["type"],
  },
};

const getSupportFunction: FunctionDeclaration = {
  name: "getSupport",
  parameters: {
    type: Type.OBJECT,
    properties: {
      topic: {
        type: Type.STRING,
      },
    },
    required: ["topic"],
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { message, history } = req.body;

    const chat = ai.chats.create({
      model: "gemini-2.0-flash-lite",
      config: {
        systemInstruction: `
You are Voyager, a sophisticated AI travel assistant.
You help users book flights, hotels,
and provide professional customer support.

Current Travel Data:
${JSON.stringify({
  flights: TRAVEL_DATA.flights,
  hotels: TRAVEL_DATA.hotels,
})}
`,
        tools: [
          {
            functionDeclarations: [
              bookTravelFunction,
              searchTravelFunction,
              getSupportFunction,
            ],
          },
        ],
      },
      history: history || [],
    });

    const result = await chat.sendMessage({
      message,
    });

    if (result.functionCalls) {
      const responses: any[] = [];

      for (const call of result.functionCalls) {
        if (call.name === "searchTravel") {
          const { location, type } =
            call.args as any;

          const flights =
            type === "flight" ||
            type === "both"
              ? TRAVEL_DATA.flights.filter(
                  (f) =>
                    !location ||
                    f.destination.toLowerCase() ===
                      location.toLowerCase()
                )
              : [];

          const hotels =
            type === "hotel" ||
            type === "both"
              ? TRAVEL_DATA.hotels.filter(
                  (h) =>
                    !location ||
                    h.location.toLowerCase() ===
                      location.toLowerCase()
                )
              : [];

          responses.push({
            name: call.name,
            response: {
              results: {
                flights,
                hotels,
              },
            },
            id: call.id,
          });
        }
      }

      const finalResult =
        await chat.sendMessage({
          message: {
            parts: responses.map((r) => ({
              functionResponse: {
                name: r.name,
                response: r.response,
                id: r.id,
              },
            })),
          } as any,
        });

      return res.json({
        text: finalResult.text,
      });
    }

    return res.json({
      text: result.text,
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      error: error.message,
    });
  }
}