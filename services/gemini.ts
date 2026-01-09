
import { GoogleGenAI } from "@google/genai";

export const generateTrainSkin = async (prompt: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Top-down orthogonal view of a single high-quality railway car texture. Theme: ${prompt}. Solid flat lighting, no perspective distortion, high detail, seamless-ready, centered on a neutral white background. Professional game asset style.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating train skin:", error);
    return null;
  }
};
