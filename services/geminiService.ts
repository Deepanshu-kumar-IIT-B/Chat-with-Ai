
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { SYSTEM_INSTRUCTION, APP_MODELS } from "../constants";
import { Message, UserProfile, AICharacter, MessageAttachment } from "../types";

export class GeminiService {
  private getInstruction(userProfile: UserProfile | null, aiCharacter: AICharacter): string {
    const characterInfo = `
- Name: ${aiCharacter.name}
- Age: ${aiCharacter.age}
- Gender: ${aiCharacter.gender}
- Personality Traits: ${aiCharacter.traits.join(', ')}
    `.trim();

    let instruction = SYSTEM_INSTRUCTION.replace('{{CHARACTER_DETAILS}}', characterInfo);

    if (userProfile) {
      const userInfo = `
- Name: ${userProfile.name}
- Age: ${userProfile.age}
- Gender: ${userProfile.gender}
- Purpose of Chat: ${userProfile.purpose}
      `.trim();
      instruction = instruction.replace('{{USER_PROFILE}}', userInfo);
    } else {
      instruction = instruction.replace('{{USER_PROFILE}}', 'Guest User');
    }

    return instruction;
  }

  async generateImage(prompt: string, retryCount = 0): Promise<MessageAttachment> {
    const MAX_RETRIES = 2;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          imageConfig: { aspectRatio: "1:1" }
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return {
            mimeType: part.inlineData.mimeType,
            data: part.inlineData.data,
            fileName: `aura-img-${Date.now()}.png`
          };
        }
      }
      throw new Error("No image data in response");
    } catch (error: any) {
      const errStr = String(error).toLowerCase();
      const isQuota = errStr.includes("429") || errStr.includes("quota");
      
      if (isQuota && retryCount < MAX_RETRIES) {
        const delay = Math.pow(2, retryCount) * 2000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.generateImage(prompt, retryCount + 1);
      }
      throw error;
    }
  }

  async streamMessage(
    history: Message[], 
    currentMessage: string, 
    userProfile: UserProfile | null, 
    aiCharacter: AICharacter,
    attachment: MessageAttachment | null,
    onChunk: (text: string) => void,
    onFileGenerated?: (attachment: MessageAttachment, type: 'image') => void,
    retryCount = 0
  ): Promise<string> {
    const MAX_RETRIES = 3;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Proactively switch to lite model if we've already hit a quota issue in this chain
    const modelToUse = retryCount > 0 ? 'gemini-flash-lite-latest' : APP_MODELS.PRIMARY;

    const supportedMultimodalTypes = [
      'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif',
      'application/pdf', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'
    ];

    const generateImageTool: FunctionDeclaration = {
      name: 'generateImage',
      parameters: {
        type: Type.OBJECT,
        description: 'Generates a photo or image based on a prompt.',
        properties: {
          prompt: { type: Type.STRING, description: 'Visual description of the image.' },
        },
        required: ['prompt'],
      },
    };

    try {
      const contents = history.map(msg => {
        const parts: any[] = [];
        if (msg.attachment && supportedMultimodalTypes.includes(msg.attachment.mimeType)) {
          parts.push({ inlineData: { mimeType: msg.attachment.mimeType, data: msg.attachment.data } });
        }
        parts.unshift({ text: msg.content || " " });
        return { role: msg.role === 'model' ? 'model' : 'user', parts };
      });

      const currentParts: any[] = [];
      if (attachment && supportedMultimodalTypes.includes(attachment.mimeType)) {
        currentParts.push({ inlineData: { mimeType: attachment.mimeType, data: attachment.data } });
      }
      currentParts.unshift({ text: currentMessage || " " });
      contents.push({ role: 'user', parts: currentParts });

      const responseStream = await ai.models.generateContentStream({
        model: modelToUse,
        contents: contents,
        config: {
          systemInstruction: this.getInstruction(userProfile, aiCharacter),
          temperature: 0.8,
          topP: 0.95,
          tools: [{ functionDeclarations: [generateImageTool] }]
        },
      });

      let fullText = "";
      for await (const chunk of responseStream) {
        if (chunk.functionCalls) {
          for (const fc of chunk.functionCalls) {
            if (onFileGenerated && fc.name === 'generateImage') {
              try {
                const img = await this.generateImage(fc.args.prompt as string);
                onFileGenerated(img, 'image');
              } catch (e) { console.error("Image gen error", e); }
            }
          }
        }
        const text = chunk.text || "";
        fullText += text;
        onChunk(text);
      }
      return fullText;
    } catch (error: any) {
      const errStr = String(error).toLowerCase();
      const isQuotaError = errStr.includes("429") || errStr.includes("quota") || errStr.includes("exhausted");

      if (isQuotaError && retryCount < MAX_RETRIES) {
        // Exponential backoff: 2s, 4s, 8s
        const delay = Math.pow(2, retryCount) * 2000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Reset the chunk for the UI on retry to avoid double text if possible
        // though stream behavior depends on where it failed.
        return this.streamMessage(history, currentMessage, userProfile, aiCharacter, attachment, onChunk, onFileGenerated, retryCount + 1);
      }

      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
