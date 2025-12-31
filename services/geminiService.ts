
import { GoogleGenAI } from "@google/genai";
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

  async autoCorrect(text: string): Promise<string> {
    if (!text.trim()) return text;
    // Create instance inside method to use current process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as a subtle text refiner. Fix typos, punctuation, and grammar in the following message while strictly preserving the user's intended tone, casualness, and emotional context. Only return the corrected text itself. No explanations or extra text.
        
Message to correct: "${text}"`,
        config: {
          temperature: 0.1,
        }
      });
      return response.text?.trim() || text;
    } catch (error: any) {
      console.error("Auto-correction error:", error);
      return text;
    }
  }

  async streamMessage(
    history: Message[], 
    currentMessage: string, 
    userProfile: UserProfile | null, 
    aiCharacter: AICharacter,
    attachment: MessageAttachment | null,
    onChunk: (text: string) => void
  ): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const contents = history.map(msg => {
        const parts: any[] = [{ text: msg.content || " " }];
        if (msg.attachment) {
          parts.push({
            inlineData: {
              mimeType: msg.attachment.mimeType,
              data: msg.attachment.data
            }
          });
        }
        return {
          role: msg.role === 'model' ? 'model' : 'user',
          parts
        };
      });

      const currentParts: any[] = [{ text: currentMessage || "Check this out." }];
      if (attachment) {
        currentParts.push({
          inlineData: {
            mimeType: attachment.mimeType,
            data: attachment.data
          }
        });
      }

      contents.push({
        role: 'user',
        parts: currentParts
      });

      const responseStream = await ai.models.generateContentStream({
        model: APP_MODELS.PRIMARY,
        contents: contents,
        config: {
          systemInstruction: this.getInstruction(userProfile, aiCharacter),
          temperature: 0.9,
          topP: 0.95,
        },
      });

      let fullText = "";
      for await (const chunk of responseStream) {
        const text = chunk.text || "";
        fullText += text;
        onChunk(text);
      }
      return fullText;
    } catch (error: any) {
      console.error("Streaming error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
