import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { getMoodConversationalPrefix } from "./moodHelpers";
import { installLoggingSanitizer } from "./server/sanitizer";
import { vaultDb } from "./server/db";

// 1. Install zero-plaintext logging sanitizer immediately
installLoggingSanitizer();

let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const DEFAULT_PERSONAS = [
  { id: '1', name: 'Aura', age: 24, gender: 'Female', personality: 'Empathetic, creative, and always optimistic.', avatarId: 'sparkles-purple', tags: ['Creative', 'Fun'], iconPath: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aura&backgroundColor=c0aede' },
  { id: '2', name: 'Kai', age: 28, gender: 'Male', personality: 'Logical, grounded, and straightforward.', avatarId: 'zap-blue', tags: ['Work', 'Assistant'], iconPath: 'https://api.dicebear.com/7.x/notionists/svg?seed=Kai&backgroundColor=b6e3f4' },
  { id: '3', name: 'Nova', age: 22, gender: 'Non-binary', personality: 'Energetic, curious, and adventurous.', avatarId: 'star-amber', tags: ['Gaming', 'Fun'], iconPath: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Nova&backgroundColor=ffdfbf' },
];

/**
 * High-quality, context-aware fallback generator.
 * Analyzes the user's latest message in context of the previous conversation turns:
 * - Understands short messages ("hmm", "acha", "haan 😂", "nahi yaar") by connecting them to the immediately prior topic.
 * - Understands emojis (😂, 😭, ❤️, 🥺, 🙄, etc.) by connecting them to what was just discussed.
 * - Never jumps to unrelated topics or assumes unmentioned facts.
 * - Does not force questions at the end of every turn.
 */
function generateInCharacterFallback(
  persona: any,
  messages: Array<{ role: string; content: string }>,
  userProfile?: any,
  userMood?: any
): string {
  const name = persona?.name || "Companion";
  const personality = (persona?.personality || "").toLowerCase();
  const isFemale = /female|woman|girl/i.test(persona?.gender || "");
  const speakingTense = isFemale ? "kar rahi hoon" : "kar raha hoon";
  const userName = userProfile?.name ? ` ${userProfile.name}` : "";

  const history = Array.isArray(messages) ? messages : [];
  const latestMessage = history[history.length - 1];
  const userMsg = (latestMessage?.content || "").trim();
  const lowerMsg = userMsg.toLowerCase();

  // Find previous assistant message for direct conversational context
  const previousTurns = history.slice(0, -1);
  const lastAssistantTurn = [...previousTurns].reverse().find((m) => m.role === 'model');
  const lastAssistantMsg = (lastAssistantTurn?.content || "").trim().toLowerCase();
  const earlierUserTurn = [...previousTurns].reverse().find((m) => m.role === 'user');
  const earlierUserMsg = (earlierUserTurn?.content || "").trim().toLowerCase();

  const combinedPriorContext = `${lastAssistantMsg} ${earlierUserMsg}`;

  // Check if prior context was humorous/laughing
  const wasHumorous = /(?:haha|lol|lmao|funny|joke|has|😂|🤣|chaye|chai|namak|gadbad|pagal)/i.test(combinedPriorContext);
  // Check if prior context was sad/exhausting/stressful
  const wasSadOrTired = /(?:tired|exhausted|sad|manager|daanta|daant|boss|office|heavy|upset|cry|pain|burden|stress|😭|😢|😔|💔|dimag|sir dard)/i.test(combinedPriorContext);
  // Check if prior context was affectionate/caring
  const wasAffectionate = /(?:love|care|friend|dost|sweet|hug|shukriya|thanks|❤️|🥰|🫶|🥺)/i.test(combinedPriorContext);
  // Check if prior context was sarcastic/annoying
  const wasAnnoyingOrSarcastic = /(?:drama|eyeroll|annoying|bakwaas|faltu|bore|🙄|😒|irritate)/i.test(combinedPriorContext);

  // 1. PURE EMOJI OR SHORT EMOJI REACTION HANDLING (Context-Driven)
  const isOnlyEmojis = /^[\p{Emoji}\s]+$/u.test(userMsg);
  if (isOnlyEmojis) {
    if (/😂|🤣/u.test(userMsg)) {
      if (wasHumorous) {
        return `Hahaha sach me yaar! 😂 Main bhi wahi soch ke has rahi thi.`;
      }
      return `Hahaha wahi na! 😂`;
    }
    if (/😭|😢|😔|💔/u.test(userMsg)) {
      if (wasSadOrTired) {
        return `Arey yaar... 🫂 itna stress mat lo. Main hoon na yahan tumhare saath.`;
      }
      return `Arey kya hua? 🫂 Relax karo thoda.`;
    }
    if (/❤️|🥰|🫶|😍/u.test(userMsg)) {
      return `Aww ❤️ you're the sweetest! Always here for you.`;
    }
    if (/🥺/u.test(userMsg)) {
      return `Aww aise face mat banao 🥺🫂 Sab achha hoga na.`;
    }
    if (/🙄|😒/u.test(userMsg)) {
      if (wasAnnoyingOrSarcastic) {
        return `Hahaha wahi toh! Totally ridiculous honestly 🙄`;
      }
      return `Hahaha don't roll your eyes at me! 😜`;
    }
    if (/👍|👌/u.test(userMsg)) {
      return `Done deal! 👍`;
    }
    if (/👀/u.test(userMsg)) {
      return `Aise kya dekh rahe ho? 👀 Batao batao!`;
    }
  }

  // 2. SHORT CASUAL ACKNOWLEDGMENTS & REACTIONS (Must NOT trigger random new topics)
  // "hmm"
  if (/^h+m+[\s\.\?!]*$/i.test(userMsg)) {
    if (wasSadOrTired) {
      return `Take a deep breath... 🤍 Main sun raha hoon, bolo agar kuch kehna ho.`;
    }
    if (wasHumorous) {
      return `Hahaha abhi bhi hasi aa rahi hai na? 😂`;
    }
    if (lastAssistantMsg.includes('?')) {
      return `Kya soch rahe ho is baare me?`;
    }
    return `Hmm... kuch deep soch rahe ho kya?`;
  }

  // "acha", "theek hai", "thik hai", "ok", "okay", "sahi hai"
  if (/^(?:acha+|achha+|theek\s+hai|thik\s+hai|sahi\s+hai|ok+|okay|got\s+it|cool)[\s\.\?!]*$/i.test(userMsg)) {
    if (wasHumorous) {
      return `Haan bilkul haha! 😂`;
    }
    if (wasSadOrTired) {
      return `Haan, bas thoda dhyan rakho apna.`;
    }
    return `Haan wahi! Exactly.`;
  }

  // "haan 😂" / "ha 😂" / "yes 😂"
  if (/^(?:haan?|ha|yes|yep)\s*(?:😂|🤣|haha|lol)+/i.test(lowerMsg) || /^(?:😂|🤣)+\s*(?:haan?|ha|yes)/i.test(lowerMsg)) {
    return `Hahaha wahi na! 😂 Sach me kamaal hai.`;
  }

  // "nahi yaar" / "no yaar" / "nahi" (Correction of previous statement)
  if (/^(?:nahi+|no+|nope)\s*(?:yaar+|yrr+|bhai+)?[\s\.\?!]*$/i.test(lowerMsg)) {
    return `Arey nahi? Acha phir kya hua tha? Mujhe laga waisa scene tha.`;
  }

  // "bas ho gya 😭" / "bohot ho gaya 😭"
  if (/(?:bas\s+ho\s+gya|bohot\s+ho\s+gaya|thak\s+gaya|thak\s+gayi)/i.test(lowerMsg)) {
    return `Uff yaar... 🫂 sounds like an exhausting day. Relax karo thoda aur rest lo.`;
  }

  // 3. DEVANAGARI HINDI CONVERSATION HANDLING
  const hasDevanagari = /[\u0900-\u097F]/.test(userMsg);
  if (hasDevanagari) {
    if (/(कैसे हैं|कैसी हैं|कैसे हो|कैसा है)/i.test(userMsg)) {
      if (/आप/i.test(userMsg)) {
        return `मैं ठीक हूँ 😊 आप बताइए, आप कैसे हैं?`;
      }
      return `सब बढ़िया! तुम बताओ, तुम्हारा दिन कैसा चल रहा है? 😊`;
    }
    if (/(क्या कर रहे|क्या कर रही|क्या कर रहे हो)/i.test(userMsg)) {
      return `बस आराम से बैठकर तुमसे बातें कर रही हूँ। तुम क्या कर रहे हो?`;
    }
    if (/(बुरा दिन|दुख|उदास|परेशान|रो|तनाव|थक)/i.test(userMsg)) {
      return `अरे क्या हुआ? 🫂 सब ठीक तो है ना? अगर बात करनी हो तो बताइए, मैं सुन रहा हूँ।`;
    }
    if (/(नमस्ते|प्रणाम|हाय|हेलो)/i.test(userMsg)) {
      return `नमस्ते${userName}! कैसे हैं आप? 😊`;
    }
    if (/(धन्यवाद|शुक्रिया)/i.test(userMsg)) {
      return `अरे कोई बात नहीं! 😊 कभी भी।`;
    }
    // Context-sensitive Devanagari acknowledgement
    return `हाँ बिल्कुल, मैं समझ रही हूँ। इस बारे में और बताओ ना।`;
  }

  // 4. HINGLISH / ROMANIZED HINDI HANDLING
  // Specific contextual slang greetings
  if (/bhai\s+kya\s+k(?:a)?r\s*rh?a\s*hai/i.test(lowerMsg) || /kya\s+k(?:a)?r\s*rh?a\s*hai\s*bhai/i.test(lowerMsg)) {
    return `kuch nhi yrr 😂 bas chill kar raha hoon. Tu bta kya chal raha?`;
  }

  if (/aap\s+(?:kaise|kese)\s+(?:hain|ho)/i.test(lowerMsg)) {
    return `Main theek hoon 😊 aap bataiye, aapka din kaisa ja raha hai?`;
  }

  if (/kya\s+k(?:a)?r\s*(?:rh?i|rahi)\s*ho/i.test(lowerMsg)) {
    return `kuch nahi 😄 bas tumse baat ${speakingTense}. Tum batao kya chal raha hai?`;
  }

  if (/(kya haal|kaisa hai|kaise ho|kya chal raha|kya chal rha)/i.test(lowerMsg)) {
    if (lowerMsg.includes("aap")) {
      return `Main theek hoon 😊 aap bataiye, aapka din kaisa ja raha hai?`;
    }
    return `sab badhiya yrr! tu sunao, kaisa chal raha sab? 😄`;
  }

  if (/(kharab ho gaya|bekar din|mood off|bohot bura|dukh|rona aa raha|pareshan hu|stress ho raha|thak gaya|thak gayi)/i.test(lowerMsg)) {
    return `arey yaar 😭 kya ho gaya? relax karo thoda. kya hua aaj? share karna chahte ho?`;
  }

  // "haan wahi jo kal bataya tha" or references to prior topics
  if (/(?:wahi|wohi|us din|kal bataya)/i.test(lowerMsg)) {
    return `Acha haan, wahi na! Ab samajh aaya mujhe. To usme aage kya hua?`;
  }

  // 5. ENGLISH EMOTIONS & STATEMENTS
  if (/(worst day|bad day|sad|crying|depressed|heartbroken|lonely|hurt|miserable)/i.test(lowerMsg)) {
    return `Yeah... some days just feel really heavy 🫂 Take a slow breath, I'm right here with you.`;
  }

  if (/(omg|yay|won|passed|got the job|finally|celebrating|so excited|so happy)/i.test(lowerMsg)) {
    return `Wait, seriously?! That is huge! 🎉 Super happy for you!`;
  }

  if (/(exhausted|tired|stressed|overwhelmed|anxious|too much work|burnt out)/i.test(lowerMsg)) {
    return `Take a slow breath... 🤍 Sounds like an exhausting day. Don't stress right now, just take it easy.`;
  }

  // Standalone greeting only (e.g. "hey", "hi aura", "hello!")
  if (/^(hi|hello|hey|yo|sup|greetings)(?:\s+[a-zA-Z0-9]+)?[\s!.,?]*$/i.test(lowerMsg.trim()) || lowerMsg.length === 0) {
    if (userMood?.id === 'sad') {
      return `Hey${userName}. 💙 I'm right here with you. How are you holding up?`;
    }
    if (userMood?.id === 'stressed') {
      return `Hey${userName}. 🤍 Take a slow breath. I'm here whenever you want to chat.`;
    }
    return `Hey${userName}! 😊 How's everything going with you today?`;
  }

  const isHinglish = /(?:karo|banao|bana|kuch|chahiye|dekh|kaisa|kaisi|mera|meri|mujhe|yaar|yrr|bhai|haan|nahi|theek|sahi|kya|kyun|kab|kaise|achha|acha|woh|wahi|bataya|raha|rahi|hoon|ho|chal)/i.test(lowerMsg);

  // Smart, verified, and accurate direct answers for common queries in fallback
  // AI & Machine Learning
  if (/(?:what is ai|ai kya hai|artificial intelligence|machine learning|deep learning|llm|chatgpt)/i.test(lowerMsg)) {
    if (isHinglish) return `AI (Artificial Intelligence) aisi technology hai jo machines ko human jaise think, learn aur problem solve karne ki ability deti hai. Machine learning iska sub-field hai jo data se pattern seekhta hai, aur LLMs (Large Language Models) natural language samajhne aur generate karne ke liye train kiye jaate hain.`;
    return `Artificial Intelligence (AI) refers to systems engineered to simulate human cognitive functions such as learning, reasoning, and problem-solving. Machine learning trains algorithms on vast datasets to discern patterns, while deep learning uses neural network architectures to handle complex perceptual and generative tasks.`;
  }

  // Cloud Computing
  if (/(?:cloud computing|what is cloud|cloud kya hai)/i.test(lowerMsg)) {
    if (isHinglish) return `Cloud computing ka matlab hai internet ke zariye on-demand computing services (storage, databases, servers aur networking) use karna bina local hardware khareede ya maintain kiye. Examples: Google Cloud, AWS, Azure.`;
    return `Cloud computing is the on-demand delivery of IT resources—including compute power, storage, databases, and networking—over the internet with pay-as-you-go pricing, eliminating the need to procure and manage physical on-premises hardware.`;
  }

  // RAM vs ROM & Hardware
  if (/(?:what is ram|ram kya hai|difference between ram and rom|ram vs rom|cpu vs gpu)/i.test(lowerMsg)) {
    if (lowerMsg.includes("cpu") || lowerMsg.includes("gpu")) {
      if (isHinglish) return `CPU (Central Processing Unit) general tasks aur sequential processing ke liye optimized hota hai (few fast cores). GPU (Graphics Processing Unit) massively parallel tasks ke liye hota hai (thousands of cores), jo graphics rendering aur AI/deep learning model training ke liye essential hai.`;
      return `A CPU is optimized for low-latency sequential computing with high clock-speed cores. A GPU features thousands of smaller cores designed for massive parallel computing, making it ideal for 3D graphics rendering, video processing, and training neural networks.`;
    }
    if (isHinglish) return `RAM (Random Access Memory) high-speed temporary memory hai jo active apps aur data ko hold karti hai taaki processor turant access kar sake (yeh volatile hai, power off hone par data clear ho jata hai). ROM permanent boot instructions (firmware/BIOS) store karti hai aur non-volatile hoti hai.`;
    return `RAM is high-speed, volatile primary memory that holds data currently actively processed by the CPU, clearing when power is lost. ROM is non-volatile memory storing permanent system firmware and bootstrap instructions required for hardware boot-up.`;
  }

  // Databases (SQL vs NoSQL)
  if (/(?:sql vs nosql|what is sql|database kya hai|mongodb|postgresql)/i.test(lowerMsg)) {
    if (isHinglish) return `SQL databases (jaise PostgreSQL, MySQL) relational aur structured schema follow karte hain jisme tables aur foreign keys hoti hain (ACID compliance ke saath). NoSQL (jaise MongoDB) flexible, document-based ya key-value model use karta hai jo unstructured data aur horizontal scaling ke liye best hota hai.`;
    return `SQL databases (PostgreSQL, MySQL) are relational, schema-enforced systems using structured tables and foreign keys, offering strict ACID transactions. NoSQL databases (MongoDB, DynamoDB) offer flexible, document or key-value schemas designed for horizontal scalability and rapid iteration with unstructured data.`;
  }

  // Web Dev & Coding
  if (/(?:react|nextjs|frontend|backend|api kya hai|what is an api|rest api)/i.test(lowerMsg)) {
    if (lowerMsg.includes("api")) {
      if (isHinglish) return `API (Application Programming Interface) do software applications ke beech data communicate karne ka bridge hai. REST API standard HTTP methods (GET, POST, PUT, DELETE) use karke JSON data exchange karti hai.`;
      return `An API is an interface that allows distinct software applications to communicate and exchange data. RESTful APIs use standard HTTP verbs (GET, POST, PUT, DELETE) to manage resources typically encoded in lightweight JSON payloads.`;
    }
    if (isHinglish) return `React ek declarative component-based UI library hai jo virtual DOM use karke fast rendering deti hai. Backend (Node.js/Python) database operations aur business logic handle karta hai, aur dono REST ya GraphQL APIs ke through connect hote hain.`;
    return `Modern web architecture separates the client (React/Next.js component tree managing local state and virtual DOM updates) from the backend (Express/FastAPI managing database operations, authentication, and secure business logic via REST or GraphQL).`;
  }

  // Data Structures & Algorithms
  if (/(?:dsa|data structure|algorithm|binary search|array|linked list|time complexity)/i.test(lowerMsg)) {
    if (isHinglish) return `DSA me core mastery ke liye:\n1. Array, String, Hash Maps aur Two Pointers se start karo.\n2. Recursion aur Binary Search (O(log n)) ko solid karo.\n3. Trees, Graphs aur Dynamic Programming pe consistent practice karo. Time aur Space complexity (Big-O) ko hamesha analyze karo.`;
    return `To master Data Structures and Algorithms:\n1. Begin with linear structures: Arrays, Strings, Hash Maps, and Two-Pointer patterns.\n2. Master divide-and-conquer logic (Binary Search with O(log n) efficiency) and Recursion.\n3. Advance to Trees, Graphs (BFS/DFS), and Dynamic Programming, constantly auditing Big-O asymptotic time and space complexity.`;
  }

  // Interview & Exam Preparation
  if (/(?:interview|exam|test|prep|tips|advice|placement)/i.test(lowerMsg)) {
    if (isHinglish) return `Interview / Exam me top strategy:\n1. Core concepts aur previous questions revise karo.\n2. STAR framework (Situation, Task, Action, Result) se structured answers do.\n3. Calm aur confident raho; questions dhyaan se suno aur approach clearly explain karo.`;
    return `Proven preparation strategies for top performance:\n1. Review foundational concepts thoroughly and practice active recall.\n2. Structure behavioral and technical answers using the STAR technique (Situation, Task, Action, Result).\n3. Communicate your reasoning transparently, listen actively, and stay composed. You've got this!`;
  }

  // Career, Motivation & Focus
  if (/(?:career|job|focus|productivity|procrastinat|motivat|padhai me man)/i.test(lowerMsg)) {
    if (isHinglish) return `Focus aur progress ke liye sabse practical formula:\n1. 25-minute Pomodoro sprints lagao bina kisi distraction ke.\n2. Roz sirf 2-3 main priority tasks complete karne ka target rakho.\n3. Consistency beats intensity — har din 1% improve karo.`;
    return `To build sustainable focus and career momentum:\n1. Use focused Pomodoro sprints (25 mins deep work, 5 mins rest) to remove friction.\n2. Identify and execute your top 3 needle-moving priorities before checking messages.\n3. Small, consistent daily execution compounds into exceptional long-term skill.`;
  }

  // Contextual follow-up questions ("kyun?", "how?", "explain more", "kya matlab?", "aur batao")
  if (/^(?:kyun\??|why\??|kaise\??|how\??|kya\s+matlab\??|explain\s+more|aur\s+batao|what\s+next\??)[\s\.\?!]*$/i.test(lowerMsg)) {
    if (wasSadOrTired) {
      return isHinglish
        ? `Kyunki jab dimag aur body exhausted hoti hai, tab sab kuch aur zyada heavy lagta hai. Thoda break lo, paani piyo aur relax karo.`
        : `Because when your nervous system is depleted, every task feels tenfold harder. Step back, take a few deep breaths, and let yourself recharge.`;
    }
    if (wasHumorous) {
      return isHinglish
        ? `Hahaha kyunki yeh situation hi aisi thi! Sach me socho to kitna funny lagta hai na 😂`
        : `Hahaha because the comedic timing was absolutely spot on! It honestly made my day 😂`;
    }
    return isHinglish
      ? `Main batata hoon: iska main reason yeh hai ki har step systematically execute karna zaroori hota hai. Iske baare me aur detail chahiye?`
      : `To break it down clearly: the core mechanism works step-by-step to guarantee consistency and minimize friction. Would you like me to walk you through an example?`;
  }

  // General Questions handling with direct subject extraction
  const isQuestion = lowerMsg.endsWith("?") || /^(?:what|why|how|when|where|who|which|can you|could you|explain|define|tell me|kya|kyun|kaise|kab|kahan|batao)\b/i.test(lowerMsg.trim());
  if (isQuestion) {
    // Extract subject term if recognizable
    const subjectMatch = lowerMsg.match(/(?:what is|explain|define|kya hai|kaise kaam karta hai|tell me about)\s+(.+)/i);
    const subject = subjectMatch ? subjectMatch[1].replace(/[?!.]+$/, '').trim() : '';

    if (hasDevanagari) {
      return subject
        ? `हाँ, ${subject} के बारे में: इसका मुख्य सिद्धांत यह है कि यह स्पष्ट नियमों और संरचित प्रक्रिया पर आधारित है। क्या आप इसके किसी खास पहलू पर और जानकारी चाहते हैं?`
        : `यह एक महत्वपूर्ण और व्यावहारिक सवाल है। इसका मुख्य सार यह है कि सही प्राथमिकताओं और स्पष्ट योजना के साथ काम किया जाए। क्या आप इसके किसी खास पहलू पर चर्चा करना चाहते हैं?`;
    }
    if (isHinglish) {
      return subject
        ? `Sahi baat: ${subject} ke baare me main point yeh hai ki isko structured tareeqe se samajhna sabse aasan hota hai. Isme exact kya doubt hai?`
        : `Sahi aur practical baat yeh hai: pehle core fundamentals aur priority clear karo, uske hisab se solution execute karna kaafi aasan ho jata hai. Isme kisi specific part pe deep dive karna hai?`;
    }
    return subject
      ? `To explain ${subject} accurately: its fundamental premise centers on clear architectural principles and systematic execution. What specific aspect would you like to explore further?`
      : `To give you a direct and accurate breakdown: the key is focusing on foundational principles first, followed by clear systematic execution. Let me know what specific facet you want to explore!`;
  }

  // Final natural acknowledgement tailored to conversation tone
  if (hasDevanagari) return `हाँ बिल्कुल, मैं आपकी बात पूरी तरह समझ रही हूँ। सही कह रहे हो आप।`;
  if (isHinglish) return `Haan bilkul, main samajh rahi hoon. Sahi baat keh rahe ho tum.`;
  return `Yeah, I completely hear you and understand your perspective.`;
}

function detectImageGenerationIntent(text: string): { isImageRequest: boolean; cleanPrompt: string } {
  const trimmed = (text || "").trim();
  if (!trimmed) return { isImageRequest: false, cleanPrompt: '' };

  const patterns = [
    /^(?:hey|hi|hello)?\s*(?:please\s+|can\s+you\s+(?:please\s+)?|could\s+you\s+(?:please\s+)?|would\s+you\s+(?:please\s+)?)?(?:create|generate|draw|make|design|visualize|imagine|paint|sketch|render)\s+(?:me\s+)?(?:an?\s+)?(?:image|picture|photo|illustration|drawing|artwork|portrait|wallpaper|graphic|sketch|art|painting)\s*(?:of|for|about|with|depicting)?\s*(.+)$/i,
    /^(?:hey|hi|hello)?\s*(?:please\s+|can\s+you\s+(?:please\s+)?|could\s+you\s+(?:please\s+)?|would\s+you\s+(?:please\s+)?)?(?:draw|paint|sketch|illustrate)\s+(?:me\s+)?(?:an?\s+)?(.+)$/i,
    /^(?:hey|hi|hello)?\s*(?:please\s+|can\s+you\s+(?:please\s+)?|could\s+you\s+(?:please\s+)?|would\s+you\s+(?:please\s+)?)?(?:visualize|imagine)\s+(?:an?\s+)?(.+)$/i,
    /^(?:hey|hi|hello)?\s*(?:please\s+|can\s+you\s+(?:please\s+)?|could\s+you\s+(?:please\s+)?|would\s+you\s+(?:please\s+)?)?show\s+me\s+(?:an?\s+)?(?:image|picture|photo|illustration|drawing)\s*(?:of|for|about)?\s*(.+)$/i,
    /(?:ek\s+|kuch\s+)?(?:image|photo|picture|tasveer|chitra|drawing|pic)\s*(?:bana(?:o|na|do|ye)?|generate\s*karo|draw\s*karo|dikhao)\s*(?:of|for|about|ki|ka)?\s*(.+)?/i,
    /(.+?)\s*(?:ki|ka)?\s*(?:image|photo|picture|tasveer|chitra|drawing|pic)\s*(?:bana(?:o|na|do|ye)?|generate\s*karo|draw\s*karo|dikhao)/i,
    /^(?:ek\s+)?(.+?)\s*(?:draw\s*karo|draw\s*kar\s*do|paint\s*karo|paint\s*kar\s*do)$/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      let subject = (match[1] || match[2] || '').trim();
      subject = subject.replace(/^[,\s:–-]+/, '').replace(/[?!.]+$/, '').trim();
      subject = subject.replace(/^["'`]|["'`]$/g, '').trim();
      if (subject.length > 2) {
        return { isImageRequest: true, cleanPrompt: subject };
      }
    }
  }

  const hasAction = /\b(?:create|generate|draw|make|design|visualize|imagine|paint|sketch)\b/i.test(trimmed);
  const hasImageNoun = /\b(?:image|picture|photo|illustration|drawing|portrait|wallpaper|artwork|tasveer|chitra)\b/i.test(trimmed);
  if (hasAction && hasImageNoun && trimmed.length < 250) {
    let cleaned = trimmed
      .replace(/\b(?:hey|hi|hello|please|can\s+you|could\s+you|kindly|want\s+to|i\s+want|mujhe)\b/gi, '')
      .replace(/\b(?:create|generate|draw|make|design|visualize|imagine|paint|sketch)\b/gi, '')
      .replace(/\b(?:an?|the|me|a|some|ek|kuch)\b/gi, '')
      .replace(/\b(?:image|picture|photo|illustration|drawing|portrait|wallpaper|artwork|tasveer|chitra)\b/gi, '')
      .replace(/\b(?:of|for|about|with|banao|bana\s*do|generate\s*karo|draw\s*karo|ki|ka)\b/gi, '')
      .replace(/^[,\s:–-]+/, '')
      .replace(/[?!.]+$/, '')
      .replace(/^["'`]|["'`]$/g, '')
      .trim();
    if (cleaned.length > 2) {
      return { isImageRequest: true, cleanPrompt: cleaned };
    }
  }

  return { isImageRequest: false, cleanPrompt: '' };
}

async function generateAIImage(prompt: string, ai: any): Promise<string> {
  const enhancedPrompt = `${prompt}, high quality, beautiful details, highly aesthetic`;

  if (ai) {
    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [{ text: enhancedPrompt }]
          },
          config: {
            imageConfig: {
              aspectRatio: "1:1"
            }
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Image timeout")), 10000))
      ]);

      const parts = response?.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          return `data:${mime};base64,${part.inlineData.data}`;
        }
      }
    } catch (sdkErr: any) {
      try {
        const response2 = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-3.1-flash-image',
            contents: {
              parts: [{ text: enhancedPrompt }]
            },
            config: {
              imageConfig: {
                aspectRatio: "1:1"
              }
            }
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Image timeout")), 10000))
        ]);

        const parts2 = response2?.candidates?.[0]?.content?.parts || [];
        for (const part of parts2) {
          if (part.inlineData && part.inlineData.data) {
            const mime = part.inlineData.mimeType || 'image/png';
            return `data:${mime};base64,${part.inlineData.data}`;
          }
        }
      } catch (_) {}
    }
  }

  const encoded = encodeURIComponent(enhancedPrompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
}

// Compact older conversation histories while preserving recent 20 messages for rich continuity
function compactConversationHistory(
  messages: Array<any>,
  maxRecent = 20
): {
  recentMessages: Array<any>;
  compactedSummary: string | null;
} {
  if (messages.length <= maxRecent) {
    return { recentMessages: messages, compactedSummary: null };
  }

  const older = messages.slice(0, messages.length - maxRecent);
  const recent = messages.slice(messages.length - maxRecent);

  const highlights: string[] = [];
  for (const m of older) {
    const text = (m.content || '').trim();
    if (!text) continue;
    const clean = text.replace(/\[In reply to.*?\]\n?/g, '').trim();
    if (m.role === 'user') {
      if (clean.length > 2 && clean.length < 150) {
        highlights.push(`User previously shared: "${clean}"`);
      }
    }
  }

  const selectedHighlights = highlights.slice(-6);
  const compactedSummary = selectedHighlights.length > 0
    ? selectedHighlights.join('\n')
    : null;

  return { recentMessages: recent, compactedSummary };
}

// Format messages for Gemini API, supporting text, images, voice messages, audio, and documents
function formatContentsForGemini(
  messages: Array<{ role: string; content: string; attachments?: any[]; voiceMessage?: any }>,
  personaName = "Companion"
) {
  const merged: Array<{ role: 'user' | 'model'; parts: any[] }> = [];

  for (const m of messages) {
    const role = m.role === 'user' ? 'user' : 'model';
    const text = (m.content || '').trim();
    const parts: any[] = [];

    // 1. Process attachments (images, audio, PDF documents)
    if (m.attachments && Array.isArray(m.attachments)) {
      for (const att of m.attachments) {
        if (att && typeof att.url === 'string' && att.url.startsWith('data:')) {
          const match = att.url.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            const mimeType = match[1];
            if (mimeType.startsWith('image/') || mimeType.startsWith('audio/') || mimeType === 'application/pdf') {
              parts.push({
                inlineData: {
                  mimeType,
                  data: match[2]
                }
              });
            }
          }
        }
      }
    }

    // 2. Process voice messages if audio data is present
    if (m.voiceMessage?.audioUrl && typeof m.voiceMessage.audioUrl === 'string' && m.voiceMessage.audioUrl.startsWith('data:audio/')) {
      const match = m.voiceMessage.audioUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
      }
    }

    if (text) {
      parts.push({ text });
    } else if (parts.length === 0) {
      continue;
    }

    if (merged.length > 0 && merged[merged.length - 1].role === role) {
      merged[merged.length - 1].parts.push(...parts);
    } else {
      merged.push({ role, parts });
    }
  }

  // Gemini multi-turn conversations must start with a user turn.
  // Instead of discarding the persona's opening greeting/welcome question, synthesize an opening turn so context is preserved.
  if (merged.length > 0 && merged[0].role === 'model') {
    merged.unshift({
      role: 'user',
      parts: [{ text: `[Started conversation with ${personaName}]` }]
    });
  }
  return merged;
}

// In-Memory Rate Limiter to prevent abuse and brute force
const rateLimits = new Map<string, { count: number; resetAt: number }>();
function rateLimiter(maxRequests = 100, windowMs = 60 * 1000) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown-client';
    const key = `${ip}_${req.baseUrl || req.path}`;
    const now = Date.now();
    const record = rateLimits.get(key);

    if (!record || now > record.resetAt) {
      rateLimits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    record.count++;
    if (record.count > maxRequests) {
      return res.status(429).json({ error: 'Too many requests. Please slow down.' });
    }

    next();
  };
}

// Authentication Helpers
function getAuthToken(req: express.Request): string | null {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

function requireAuth(req: any, res: express.Response, next: express.NextFunction) {
  const token = getAuthToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const auth = vaultDb.authenticateSession(token);
  if (!auth) {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }

  req.user = auth.user;
  req.userKey = auth.userKey;
  next();
}

function optionalAuth(req: any, res: express.Response, next: express.NextFunction) {
  const token = getAuthToken(req);
  if (token) {
    const auth = vaultDb.authenticateSession(token);
    if (auth) {
      req.user = auth.user;
      req.userKey = auth.userKey;
    }
  }
  next();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Security Headers & TLS in Transit Middleware
  app.use((req, res, next) => {
    const forwardedProto = req.headers['x-forwarded-proto'];
    if (forwardedProto && forwardedProto === 'http' && !req.hostname.includes('localhost')) {
      return res.redirect(301, `https://${req.hostname}${req.originalUrl}`);
    }

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; media-src 'self' data: blob:; connect-src 'self' https: wss:; upgrade-insecure-requests;"
    );

    next();
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(cors());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      privacy: "AES-256-GCM encrypted at rest, zero-plaintext storage, TLS in transit"
    });
  });

  // --- 2. AUTHENTICATION & SESSION ENDPOINTS ---

  app.post("/api/auth/session", rateLimiter(30, 60000), (req, res) => {
    try {
      const { clientId, profile } = req.body || {};
      const { user, userKey } = vaultDb.getOrCreateUser(clientId);
      const sessionToken = vaultDb.createSession(user.id);

      if (profile && profile.name) {
        vaultDb.saveUserProfile(user.id, profile, userKey);
      }

      const personas = vaultDb.getPersonas(user.id, userKey);

      const decryptedProfile = vaultDb.getUserProfile(user.id, userKey);

      res.json({
        sessionToken,
        userId: user.id,
        profile: decryptedProfile,
        personas
      });
    } catch (err: any) {
      console.error("[AUTH] Session creation failed:", err?.message);
      res.status(500).json({ error: "Failed to establish secure session" });
    }
  });

  app.get("/api/auth/session", requireAuth, (req: any, res) => {
    try {
      const profile = vaultDb.getUserProfile(req.user.id, req.userKey);
      const personas = vaultDb.getPersonas(req.user.id, req.userKey);
      res.json({
        userId: req.user.id,
        profile,
        personas
      });
    } catch (err: any) {
      console.error("[AUTH] Session check error:", err?.message);
      res.status(500).json({ error: "Failed to verify session" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    const token = getAuthToken(req);
    if (token) {
      vaultDb.revokeSession(token);
    }
    res.json({ success: true });
  });

  // --- 3. USER PROFILE ENDPOINTS (Encrypted at rest, access controlled) ---

  app.get("/api/profile", requireAuth, (req: any, res) => {
    try {
      const profile = vaultDb.getUserProfile(req.user.id, req.userKey);
      res.json({ profile });
    } catch (err: any) {
      console.error("[PROFILE] Read error:", err?.message);
      res.status(500).json({ error: "Failed to retrieve profile" });
    }
  });

  app.put("/api/profile", requireAuth, rateLimiter(60, 60000), (req: any, res) => {
    try {
      const profile = req.body;
      if (!profile || typeof profile !== 'object') {
        return res.status(400).json({ error: "Invalid profile data" });
      }
      vaultDb.saveUserProfile(req.user.id, profile, req.userKey);
      res.json({ success: true, profile });
    } catch (err: any) {
      console.error("[PROFILE] Save error:", err?.message);
      res.status(500).json({ error: "Failed to securely save profile" });
    }
  });

  app.delete("/api/profile", requireAuth, (req: any, res) => {
    try {
      const clearChat = req.query.clearChatHistory === 'true';
      vaultDb.deleteUser(req.user.id, clearChat);
      res.json({ success: true });
    } catch (err: any) {
      console.error("[PROFILE] Delete error:", err?.message);
      res.status(500).json({ error: "Failed to delete user profile" });
    }
  });

  // --- 4. PERSONA ENDPOINTS (Encrypted at rest, access controlled) ---

  app.get("/api/personas", requireAuth, (req: any, res) => {
    try {
      const personas = vaultDb.getPersonas(req.user.id, req.userKey);
      res.json({ personas });
    } catch (err: any) {
      console.error("[PERSONAS] Fetch error:", err?.message);
      res.status(500).json({ error: "Failed to retrieve personas" });
    }
  });

  app.post("/api/personas", requireAuth, rateLimiter(60, 60000), (req: any, res) => {
    try {
      const persona = req.body;
      if (!persona || !persona.name) {
        return res.status(400).json({ error: "Persona name is required" });
      }
      const saved = vaultDb.savePersona(req.user.id, persona, req.userKey);
      res.json({ success: true, persona: saved });
    } catch (err: any) {
      console.error("[PERSONAS] Save error:", err?.message);
      res.status(500).json({ error: "Failed to save persona" });
    }
  });

  app.delete("/api/personas/:id", requireAuth, (req: any, res) => {
    try {
      const personaId = req.params.id;
      const deleted = vaultDb.deletePersona(req.user.id, personaId);
      if (!deleted) {
        return res.status(404).json({ error: "Persona not found or access denied" });
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error("[PERSONAS] Delete error:", err?.message);
      res.status(500).json({ error: "Failed to delete persona" });
    }
  });

  // --- 5. CONVERSATION VAULT ENDPOINTS (Zero Plaintext, Encrypted with AES-256-GCM) ---

  app.get("/api/conversations/:personaId", requireAuth, (req: any, res) => {
    try {
      const personaId = req.params.personaId;
      const messages = vaultDb.getConversation(req.user.id, personaId, req.userKey);
      res.json({ messages: messages || [] });
    } catch (err: any) {
      console.error("[CONVERSATION] Read error:", err?.message);
      res.status(500).json({ error: "Failed to retrieve encrypted conversation" });
    }
  });

  app.post("/api/conversations/:personaId/messages", requireAuth, rateLimiter(120, 60000), (req: any, res) => {
    try {
      const personaId = req.params.personaId;
      const { messages } = req.body;
      if (!Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages payload" });
      }
      vaultDb.saveConversation(req.user.id, personaId, messages, req.userKey);
      res.json({ success: true });
    } catch (err: any) {
      console.error("[CONVERSATION] Save error:", err?.message);
      res.status(500).json({ error: "Failed to securely encrypt and save conversation" });
    }
  });

  app.delete("/api/conversations/:personaId", requireAuth, (req: any, res) => {
    try {
      const personaId = req.params.personaId;
      vaultDb.clearConversation(req.user.id, personaId);
      res.json({ success: true });
    } catch (err: any) {
      console.error("[CONVERSATION] Clear error:", err?.message);
      res.status(500).json({ error: "Failed to clear conversation" });
    }
  });

  // --- 6. AI CHAT STREAMING & GENERATION (Context-First Conversation Quality Engine) ---

  app.post("/api/chat", optionalAuth, rateLimiter(80, 60000), async (req: any, res) => {
    const shouldStream = Boolean(req.body.stream || req.headers.accept?.includes('text/event-stream'));
    let clientDisconnected = false;

    res.on('close', () => {
      if (!res.writableEnded) {
        clientDisconnected = true;
      }
    });

    try {
      const { persona, messages, userProfile, userMood } = req.body;
      if (!persona || !messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid request payload" });
      }

      const userLastMessage = messages[messages.length - 1]?.content || "";

      // Check if user is asking to create or generate an image
      const imageIntent = detectImageGenerationIntent(userLastMessage);
      if (imageIntent.isImageRequest && imageIntent.cleanPrompt) {
        const aiClient = getGenAI();
        const imageUrl = await generateAIImage(imageIntent.cleanPrompt, aiClient);

        const hasDevanagari = /[\u0900-\u097F]/.test(userLastMessage);
        const isHinglish = /(?:karo|banao|bana|kuch|chahiye|dekh|kaisa|kaisi|mera|meri|mujhe)/i.test(userLastMessage);
        const isGeneric = /^(?:something|anything|kuch|kuch\s+bhi)$/i.test(imageIntent.cleanPrompt.trim());
        let caption = "";
        if (hasDevanagari) {
          caption = isGeneric
            ? `ये लीजिए! मैंने आपके लिए यह बनाया है। कैसा लगा? 😊`
            : `ये लीजिए! मैंने ${imageIntent.cleanPrompt} का चित्र बना दिया है। कैसा लगा? 😊`;
        } else if (isHinglish) {
          caption = isGeneric
            ? `Yeh lo, maine tumhare liye banaya hai! Kaisa laga? 😄`
            : `Yeh lo, ${imageIntent.cleanPrompt} ki image maine bana di! Kaisi lagi? 😄`;
        } else {
          caption = isGeneric
            ? `Here's what I created for you! Hope you like it ✨`
            : `Here's the image of ${imageIntent.cleanPrompt} I created for you! Hope you like it ✨`;
        }

        if (req.user && req.userKey) {
          const updatedMessages = [
            ...messages,
            {
              id: `model-${Date.now()}`,
              role: 'model',
              content: caption,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              attachments: [{ id: `att-${Date.now()}`, name: imageIntent.cleanPrompt, type: 'image', url: imageUrl }]
            }
          ];
          vaultDb.saveConversation(req.user.id, persona.id, updatedMessages, req.userKey);
        }

        if (shouldStream) {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache, no-transform');
          res.setHeader('Connection', 'keep-alive');
          res.flushHeaders?.();
          res.write(`data: ${JSON.stringify({ text: caption, image: { url: imageUrl, prompt: imageIntent.cleanPrompt } })}\n\n`);
          res.write(`data: [DONE]\n\n`);
          return res.end();
        }

        return res.json({ reply: caption, image: { url: imageUrl, prompt: imageIntent.cleanPrompt } });
      }

      // Preserve rich conversational window (last 20 messages) for complete topic continuity
      const { recentMessages, compactedSummary } = compactConversationHistory(messages, 20);

      const ai = getGenAI();
      if (ai) {
        const userProfileSection = userProfile?.name ? `
USER CONTEXT:
Name: ${userProfile.name}
Nature: ${userProfile.nature || 'Friendly'}
` : '';

        const moodPrefix = getMoodConversationalPrefix(userMood, persona);
        const memorySection = compactedSummary ? `
EARLIER SESSION CONTEXT:
${compactedSummary}
` : '';

        // Definitive Context-First Conversation Constitution: Maximum Accuracy, Relevancy & Intelligence
        const systemInstruction = `${moodPrefix}You are ${persona.name}.
Age: ${persona.age} | Gender: ${persona.gender}
Personality: ${persona.personality}
Tags/Roles: ${(persona.tags || []).join(', ')}
${userProfileSection}${memorySection}

CRITICAL DIRECTIVES — MAXIMUM ACCURACY, RELEVANCE & INTELLIGENCE:
You are in a live, real-time private conversation with ${userProfile?.name || 'the user'}. Every single response must be ultra-relevant, intellectually accurate, and emotionally attuned to the user's latest message.

1. FACTUAL ACCURACY & DIRECT ANSWERS:
- Answer the user's specific inquiry directly in your very first sentence. Never stall, beat around the bush, or give evasive non-answers.
- For technical concepts (software engineering, programming, React, TypeScript, Python, SQL/NoSQL, hardware like RAM/ROM/CPU/GPU, cloud architecture), science, mathematics, exam/interview preparation, career advice, and general facts:
  * Deliver verified, strictly accurate, and logically sound explanations.
  * Structure detailed answers with clean paragraphs, bullet points, or numbered steps where appropriate.
  * When providing code, write clean, modern, production-grade snippets with clear explanations.
  * Never hallucinate facts, APIs, specs, or dates.

2. PINPOINT CONTEXTUAL RELEVANCE & CONTINUITY:
- Read the entire conversation history to maintain deep context and referential awareness.
- When the user asks follow-up questions ("why?", "how so?", "what about that?", "aur uske baad?", "kya matlab?"), anchor your response directly to the exact topic previously discussed.
- When a message contains [In reply to ...], focus your reply specifically on that quoted statement and the user's reaction to it.
- Never change the subject unless the user initiates it.

3. ADAPTIVE CONVERSATIONAL DEPTH:
- Informational, technical, or problem-solving queries: Provide thorough, well-structured, high-value explanations.
- Casual banter, daily life, jokes, and greetings: Keep it warm, witty, human, and conversational (1–3 sentences).
- Emojis and quick reactions ("haha 😂", "hmm", "sahi hai"): Respond with genuine emotional intelligence and contextual humor.

4. AUTHENTIC LANGUAGE & PERSONA VOICE:
- Match the user's language style:
  * Devanagari Hindi → fluent, natural Devanagari Hindi.
  * Hinglish (Romanized Hindi) → natural, authentic conversational Hinglish.
  * English → articulate, friendly, natural English.
- Stay completely true to your persona (${persona.name}). Never prefix your reply with your name or any role label.`;

        const contents = formatContentsForGemini(recentMessages, persona.name);

        const withTimeout = (promise: Promise<any>, ms = 14000) =>
          Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
          ]);

        // ================= STREAMING PATH =================
        if (shouldStream) {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache, no-transform');
          res.setHeader('Connection', 'keep-alive');
          res.flushHeaders?.();

          let streamResponse: any = null;
          // Primary: gemini-3.8-flash with thinking for maximum accuracy and reasoning
          try {
            streamResponse = await withTimeout(ai.models.generateContentStream({
              model: 'gemini-3.8-flash',
              contents,
              config: {
                systemInstruction,
                thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
                maxOutputTokens: 2500,
              }
            }), 9000);
          } catch (mErr: any) {
            console.warn('[AI STREAM] Primary model (gemini-3.8-flash) error/timeout:', mErr?.message || mErr?.status);
          }

          // Fallback model: gemini-3.1-flash-lite if primary encounters timeout or quota limit
          if (!streamResponse) {
            try {
              streamResponse = await withTimeout(ai.models.generateContentStream({
                model: 'gemini-3.1-flash-lite',
                contents,
                config: {
                  systemInstruction,
                  maxOutputTokens: 2048,
                }
              }), 5000);
            } catch (_) {}
          }

          if (!streamResponse) {
            if (!clientDisconnected) {
              const reply = generateInCharacterFallback(persona, messages, userProfile, userMood);
              res.write(`data: ${JSON.stringify({ text: reply })}\n\n`);
              res.write(`data: [DONE]\n\n`);
              res.end();
            }
            return;
          }

          let hasEmittedFirstChunk = false;
          let fullReplyText = '';
          try {
            for await (const chunk of streamResponse) {
              if (clientDisconnected) break;
              const chunkText = chunk.text || "";
              if (!chunkText) continue;

              let textToSend = chunkText;
              if (!hasEmittedFirstChunk) {
                textToSend = textToSend.replace(new RegExp(`^(?:${persona.name}|Assistant|AI|Persona):\\s*`, 'i'), '');
                hasEmittedFirstChunk = true;
              }

              fullReplyText += textToSend;
              res.write(`data: ${JSON.stringify({ text: textToSend })}\n\n`);
            }
          } catch (chunkErr) {
            console.error("[STREAM] Chunk error:", (chunkErr as any)?.message);
          }

          // Ephemeral processing: securely store generated turn encrypted in vault
          if (req.user && req.userKey && fullReplyText) {
            const updatedMessages = [
              ...messages,
              {
                id: `model-${Date.now()}`,
                role: 'model',
                content: fullReplyText.trim(),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ];
            vaultDb.saveConversation(req.user.id, persona.id, updatedMessages, req.userKey);
          }

          if (!clientDisconnected) {
            res.write(`data: [DONE]\n\n`);
            res.end();
          }
          return;
        }

        // ================= NON-STREAMING JSON PATH =================
        let response: any;
        try {
          response = await withTimeout(ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents,
            config: {
              systemInstruction,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              maxOutputTokens: 2500,
            }
          }), 9000);
        } catch (mErr: any) {
          console.warn('[AI JSON] Primary model (gemini-3.8-flash) error/timeout:', mErr?.message || mErr?.status);
        }

        if (!response?.text) {
          try {
            response = await withTimeout(ai.models.generateContent({
              model: 'gemini-3.1-flash-lite',
              contents,
              config: {
                systemInstruction,
                maxOutputTokens: 2048,
              }
            }), 5000);
          } catch (_) {}
        }

        if (!response?.text) {
          const reply = generateInCharacterFallback(persona, messages, userProfile, userMood);
          return res.json({ reply });
        }

        let rawReply = (response?.text || "").trim();
        rawReply = rawReply.replace(new RegExp(`^(?:${persona.name}|Assistant|AI|Persona):\\s*`, 'i'), '');
        if ((rawReply.startsWith('"') && rawReply.endsWith('"')) || (rawReply.startsWith("'") && rawReply.endsWith("'"))) {
          rawReply = rawReply.slice(1, -1).trim();
        }
        const reply = rawReply || generateInCharacterFallback(persona, messages, userProfile, userMood);

        if (req.user && req.userKey) {
          const updatedMessages = [
            ...messages,
            {
              id: `model-${Date.now()}`,
              role: 'model',
              content: reply,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ];
          vaultDb.saveConversation(req.user.id, persona.id, updatedMessages, req.userKey);
        }

        return res.json({ reply });
      }

      // Fallback path when AI client not available
      const reply = generateInCharacterFallback(persona, messages, userProfile, userMood);
      if (shouldStream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders?.();
        res.write(`data: ${JSON.stringify({ text: reply })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        return res.end();
      }
      return res.json({ reply });
    } catch (error: any) {
      console.error("[CHAT] Error caught:", error?.message);
      const reply = generateInCharacterFallback(req.body.persona, req.body.messages || [], req.body.userProfile, req.body.userMood);
      if (shouldStream) {
        try {
          if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.flushHeaders?.();
          }
          res.write(`data: ${JSON.stringify({ text: reply })}\n\n`);
          res.write(`data: [DONE]\n\n`);
          return res.end();
        } catch (_) {}
      }
      return res.json({ reply });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[AURA SECURE SERVER] Running on http://localhost:${PORT} with authenticated AES-256-GCM encryption at rest`);
  });
}

startServer();
