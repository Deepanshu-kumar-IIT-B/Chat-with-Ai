
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
    const MAX_RETRIES = 2;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Fallback to flash-lite if primary model fails consistently
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
      // 1. Filter history: Remove placeholders and ensure valid content
      // 2. Ensure alternating roles (User, Model, User, Model...)
      const cleanHistory = history.filter(msg => 
        msg.status !== 'sending' && (msg.content?.trim() || msg.attachment)
      );

      const contents: any[] = [];
      let lastRole: string | null = null;

      for (const msg of cleanHistory) {
        const role = msg.role === 'model' ? 'model' : 'user';
        
        // Gemini requires alternating roles. If we have consecutive roles, merge or skip.
        if (role === lastRole) continue; 

        const parts: any[] = [];
        if (msg.attachment && supportedMultimodalTypes.includes(msg.attachment.mimeType)) {
          parts.push({ inlineData: { mimeType: msg.attachment.mimeType, data: msg.attachment.data } });
        }
        
        // Every turn must have at least one part. If no text and no attachment, skip.
        if (!msg.content?.trim() && parts.length === 0) continue;

        if (msg.content?.trim()) {
          parts.unshift({ text: msg.content.trim() });
        }

        contents.push({ role, parts });
        lastRole = role;
      }

      // Add the current user turn
      const currentParts: any[] = [];
      if (attachment && supportedMultimodalTypes.includes(attachment.mimeType)) {
        currentParts.push({ inlineData: { mimeType: attachment.mimeType, data: attachment.data } });
      }
      
      // Ensure we have text even if it's just a space, but preferably meaningful
      currentParts.unshift({ text: currentMessage.trim() || " " });

      // Check if the last turn in history was a user turn. 
      // If it was, we might need to "fix" the sequence by adding a dummy model response 
      // or merging, but usually filtering history handles this.
      if (lastRole === 'user') {
        contents.push({ role: 'model', parts: [{ text: "..." }] });
      }

      contents.push({ role: 'user', parts: currentParts });

      const responseStream = await ai.models.generateContentStream({
        model: modelToUse,
        contents: contents,
        config: {
          systemInstruction: this.getInstruction(userProfile, aiCharacter),
          temperature: 0.9,
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
              } catch (e) { console.error("Image generation failed", e); }
            }
          }
        }
        const text = chunk.text || "";
        fullText += text;
        onChunk(text);
      }
      return fullText;
    } catch (error: any) {
      console.error("Gemini API stream error:", error);
      const errStr = String(error).toLowerCase();
      
      // Handle the specific "status code 0" or 500 error with retries
      const shouldRetry = (errStr.includes("429") || errStr.includes("quota") || errStr.includes("500") || errStr.includes("code: 0")) && retryCount < MAX_RETRIES;

      if (shouldRetry) {
        const delay = Math.pow(2, retryCount) * 2000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.streamMessage(history, currentMessage, userProfile, aiCharacter, attachment, onChunk, onFileGenerated, retryCount + 1);
      }

      throw error;
    }
  }
}

export const geminiService = new GeminiService();
