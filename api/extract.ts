import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req: any, res: any) {
  // CORS Headers for safety
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const mimeTypeMatch = image.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";
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
      res.status(200).json({ data: JSON.parse(successText) });
    } else {
      console.error("Extraction failed: Tried all models but failed");
      throw lastError || new Error("Failed to extract card details");
    }
  } catch (error: any) {
    console.error("Extraction error:", error);
    res.status(500).json({ error: error.message || "Failed to extract card details" });
  }
}
