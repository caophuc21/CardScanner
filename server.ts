import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase body limit for image payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post("/api/extract", async (req, res) => {
  console.log("=== Received /api/extract request ===");
  try {
    const { image } = req.body; // base64 string
    
    if (!image) {
      console.warn("Extraction failed: No image payload provided");
      return res.status(400).json({ error: "No image provided" });
    }

    const mimeTypeMatch = image.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
    console.log(`Detected MIME type: ${mimeType}, Base64 length: ${image.length}`);

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    let lastError: any = null;
    let successText = "";

    for (const model of models) {
      let retries = 3;
      let delay = 1000; // start with 1 second delay
      
      while (retries > 0) {
        try {
          console.log(`Attempting extraction using model: ${model} (Retries left: ${retries - 1})...`);
          const response = await ai.models.generateContent({
            model: model,
            contents: [
              { text: "Extract the details from this business card. Return a JSON object with: name, jobTitle, company, phone, email, website, address. If any field is not found or unclear, leave it as an empty string." },
              { inlineData: { data: base64Data, mimeType } }
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  jobTitle: { type: Type.STRING },
                  company: { type: Type.STRING },
                  phone: { type: Type.STRING },
                  email: { type: Type.STRING },
                  website: { type: Type.STRING },
                  address: { type: Type.STRING },
                },
                required: ["name", "jobTitle", "company", "phone", "email", "website", "address"]
              }
            }
          });
          
          if (response.text) {
            console.log(`Gemini API call successful with model: ${model}!`);
            successText = response.text;
            break; // Exit retry loop
          }
          throw new Error("Empty response from AI");
        } catch (err: any) {
          lastError = err;
          const status = err.status || (err.message && err.message.match(/status:\s*(\d+)/)?.[1]);
          const isRetryable = status === 503 || status === 429 || status === "503" || status === "429" ||
                              (err.message && (err.message.includes("503") || err.message.includes("429") || err.message.includes("high demand")));
          
          console.warn(`Error with model ${model} (status: ${status}):`, err.message || err);
          
          if (isRetryable && retries > 1) {
            console.log(`Waiting ${delay}ms before retrying...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // exponential backoff
            retries--;
          } else {
            // Try next model
            break;
          }
        }
      }
      
      if (successText) {
        break; // Exit model loop
      }
    }

    if (successText) {
      res.json({ data: JSON.parse(successText) });
    } else {
      console.error("Extraction failed: Tried all models but failed");
      throw lastError || new Error("Failed to extract card details");
    }
  } catch (error: any) {
    console.error("Extraction error:", error);
    res.status(500).json({ error: error.message || "Failed to extract card details" });
  }
});

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
