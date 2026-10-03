import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import Stripe from "stripe";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});
const upload = multer({ storage: multer.memoryStorage() });

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Stripe Checkout Endpoint
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { itemId, title, returnUrl } = req.body;
      const stripe = getStripe();
      
      // Determine base URL for success/cancel redirects
      let baseUrl = returnUrl;
      if (!baseUrl) {
        const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
        const host = req.headers["x-forwarded-host"] || req.get("host") || "localhost:3000";
        baseUrl = `${proto}://${host}`;
      }
      
      // Ensure we have a clean base URL without query strings or hashes
      const cleanBaseUrl = baseUrl.split("?")[0].split("#")[0];
      
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Boost Listing: ${title}`,
                description: "Increase visibility for your item in nearby search streams for 24 hours.",
              },
              unit_amount: 199, // $1.99
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${cleanBaseUrl}?boost_success=true&item_id=${itemId}`,
        cancel_url: `${cleanBaseUrl}?boost_cancel=true`,
      });

      res.json({ id: session.id, url: session.url });
    } catch (e: any) {
      console.error("Stripe Error:", e);
      res.status(500).json({ error: e.message || "Failed to create checkout session" });
    }
  });

  // API Route for Vision AI Drafting
  app.post("/api/draft-listing", upload.array("photos"), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No photos provided" });
      }

      // Convert images to base64 for Gemini
      const parts = files.map(file => ({
        inlineData: {
          data: file.buffer.toString("base64"),
          mimeType: file.mimetype,
        }
      }));

      const prompt = `Identify the main item visible in the uploaded image using your computer vision capabilities. Do NOT base your analysis solely on the filename of the image; prioritize your vision reasoning to see the item and identify what it is (e.g., if it is a stroller, a lamp, a textbook, clothing, etc.).
Generate a strict JSON response containing:
- title: A very short, catchy title (e.g., "IKEA Desk", "Mini Fridge", "Adjustable Lamp", "Baby Stroller").
- category: One of: "Event Tickets", "Textbooks", "Furniture", "Electronics", "Appliances", "Decor", "Clothing", "Other".
- description: A brief appealing description of the item, its condition, and why it's great for campus or student use.
- estimatedOriginalPrice: A realistic integer estimate of the original retail price in USD.
- suggestedSalePrice: A suggested reasonable integer price for quick resale in USD.

Respond ONLY with valid JSON. Do not include markdown code block syntax.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          ...parts,
          { text: prompt }
        ],
        config: {
            responseMimeType: "application/json",
        }
      });

      let jsonText = response.text || "{}";
      // Ensure we strip out any possible markdown block
      jsonText = jsonText.replace(/^```json/g, "").replace(/```$/g, "").trim();
      const draft = JSON.parse(jsonText);
      res.json(draft);
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to generate draft." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
