import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
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

// Function Declarations for Gemini
const bookTravelFunction: FunctionDeclaration = {
  name: "bookTravel",
  parameters: {
    type: Type.OBJECT,
    description: "Book a flight or hotel for the user.",
    properties: {
      type: { type: Type.STRING, enum: ["flight", "hotel"], description: "Type of booking" },
      itemId: { type: Type.STRING, description: "The ID of the flight or hotel" },
      customerName: { type: Type.STRING, description: "Customer name for the booking" }
    },
    required: ["type", "itemId", "customerName"],
  },
};

const searchTravelFunction: FunctionDeclaration = {
  name: "searchTravel",
  parameters: {
    type: Type.OBJECT,
    description: "Search for available flights or hotels.",
    properties: {
      location: { type: Type.STRING, description: "The destination city" },
      type: { type: Type.STRING, enum: ["flight", "hotel", "both"], description: "What to search for" }
    },
    required: ["type"],
  },
};

const getSupportFunction: FunctionDeclaration = {
  name: "getSupport",
  parameters: {
    type: Type.OBJECT,
    description: "Provide customer support or answer common questions.",
    properties: {
      topic: { type: Type.STRING, description: "The topic of support (e.g., refund, baggage, cancellation)" }
    },
    required: ["topic"],
  },
};

// API Endpoints
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `You are Voyager, a sophisticated AI travel assistant. 
        You help users book flights, hotels, and provide professional customer support. 
        Keep your tone refined, helpful, and concise. 
        Use the available tools to search for information and perform bookings.
        Current Travel Data: ${JSON.stringify({ flights: TRAVEL_DATA.flights, hotels: TRAVEL_DATA.hotels })}`,
        tools: [{ functionDeclarations: [bookTravelFunction, searchTravelFunction, getSupportFunction] }],
      },
      history: history || [],
    });

    const result = await chat.sendMessage({ message });
    
    // Check for function calls
    if (result.functionCalls) {
      const responses: any[] = [];
      for (const call of result.functionCalls) {
        if (call.name === "searchTravel") {
          const { location, type } = call.args as any;
          const flights = (type === "flight" || type === "both") ? TRAVEL_DATA.flights.filter(f => !location || f.destination.toLowerCase() === location.toLowerCase()) : [];
          const hotels = (type === "hotel" || type === "both") ? TRAVEL_DATA.hotels.filter(h => !location || h.location.toLowerCase() === location.toLowerCase()) : [];
          responses.push({ name: call.name, response: { results: { flights, hotels } }, id: call.id });
        } else if (call.name === "bookTravel") {
          const { type, itemId, customerName } = call.args as any;
          const booking = { id: `B${Date.now()}`, type, itemId, customerName, date: new Date().toISOString() };
          TRAVEL_DATA.bookings.push(booking);
          responses.push({ name: call.name, response: { status: "success", bookingId: booking.id }, id: call.id });
        } else if (call.name === "getSupport") {
          const { topic } = call.args as any;
          responses.push({ name: call.name, response: { info: `Our policy on ${topic} is very flexible. Please contact our human specialists if you need further help beyond this AI assistance.` }, id: call.id });
        }
      }

      // Send responses back to Gemini to get a final natural language answer
      const finalResult = await chat.sendMessage({
        message: {
          parts: responses.map(r => ({
            functionResponse: { name: r.name, response: r.response, id: r.id }
          }))
        } as any
      });
      return res.json({ text: finalResult.text });
    }

    res.json({ text: result.text });
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: error.message });
  }
});

// Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
