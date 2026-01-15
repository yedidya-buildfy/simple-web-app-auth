import { GoogleGenerativeAI, Part } from "@google/generative-ai";

// Use Gemini 3 Flash for all processing
const MODEL_NAME = "gemini-3-flash-preview";

// Lazy initialization of Gemini client
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }
    console.log(`[GEMINI] Initializing with API key (length: ${apiKey.length})`);
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export interface GeminiRequest {
  prompt: string;
  images?: string[]; // Base64 encoded images
  jsonSchema?: object; // For structured output
}

export interface GeminiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  rawResponse?: string;
}

/**
 * Send a request to Gemini with optional images and structured JSON output
 */
export async function queryGemini<T>(
  request: GeminiRequest
): Promise<GeminiResponse<T>> {
  console.log("[GEMINI] Starting query...");
  console.log("[GEMINI] Model:", MODEL_NAME);
  console.log("[GEMINI] Has images:", !!(request.images && request.images.length > 0));
  console.log("[GEMINI] Has JSON schema:", !!request.jsonSchema);
  console.log("[GEMINI] Prompt length:", request.prompt.length);

  try {
    const client = getGenAI();
    const model = client.getGenerativeModel({
      model: MODEL_NAME,
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent extraction
        maxOutputTokens: 32768, // Increased for large documents
        responseMimeType: request.jsonSchema ? "application/json" : "text/plain",
      },
    });

    // Build content parts
    const parts: Part[] = [];

    // Add images first if provided
    if (request.images && request.images.length > 0) {
      for (const imageBase64 of request.images) {
        // Extract mime type and data from base64 string
        const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          parts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2],
            },
          });
        } else {
          // Assume it's raw base64 data (default to image/jpeg)
          parts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64,
            },
          });
        }
      }
    }

    // Add the text prompt
    let finalPrompt = request.prompt;
    if (request.jsonSchema) {
      finalPrompt += `\n\nRespond with valid JSON matching this schema:\n${JSON.stringify(request.jsonSchema, null, 2)}`;
    }
    parts.push({ text: finalPrompt });

    // Generate content
    console.log("[GEMINI] Sending request to API...");
    const result = await model.generateContent(parts);
    const response = result.response;
    const text = response.text();
    console.log("[GEMINI] Response received, length:", text.length);
    console.log("[GEMINI] Response preview:", text.substring(0, 500));

    // Parse JSON if schema was provided
    if (request.jsonSchema) {
      try {
        // Clean up response - remove markdown code blocks if present
        let jsonText = text.trim();
        if (jsonText.startsWith("```json")) {
          jsonText = jsonText.slice(7);
        }
        if (jsonText.startsWith("```")) {
          jsonText = jsonText.slice(3);
        }
        if (jsonText.endsWith("```")) {
          jsonText = jsonText.slice(0, -3);
        }
        jsonText = jsonText.trim();

        console.log("[GEMINI] Parsing JSON...");
        const parsed = JSON.parse(jsonText) as T;
        console.log("[GEMINI] JSON parsed successfully");
        return {
          success: true,
          data: parsed,
          rawResponse: text,
        };
      } catch (parseError) {
        console.error("[GEMINI] JSON parse error:", parseError);
        console.error("[GEMINI] Raw text that failed to parse:", text);
        return {
          success: false,
          error: `Failed to parse JSON response: ${parseError}`,
          rawResponse: text,
        };
      }
    }

    return {
      success: true,
      data: text as unknown as T,
      rawResponse: text,
    };
  } catch (error) {
    console.error("[GEMINI] API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown Gemini API error",
    };
  }
}

/**
 * Convert file buffer to base64 for image processing
 */
export function bufferToBase64(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}
