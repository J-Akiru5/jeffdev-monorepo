import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const CHAT_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
const EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2";

let _genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (_genAI) return _genAI;
  if (!API_KEY) throw new Error("Gemini not configured. Set GOOGLE_GEMINI_API_KEY or GEMINI_API_KEY.");
  _genAI = new GoogleGenerativeAI(API_KEY);
  return _genAI;
}

export async function generateEmbedding(
  text: string,
  model?: string,
): Promise<number[]> {
  const genAI = getClient();
  const embeddingModel = genAI.getGenerativeModel({
    model: model || EMBEDDING_MODEL,
  });
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

export async function batchGenerateEmbeddings(
  texts: string[],
  model?: string,
): Promise<number[][]> {
  return Promise.all(texts.map((t) => generateEmbedding(t, model)));
}

export async function generateChat(
  systemPrompt: string,
  userMessage: string,
  model?: string,
): Promise<string> {
  const genAI = getClient();
  const chatModel = genAI.getGenerativeModel({
    model: model || CHAT_MODEL,
    systemInstruction: systemPrompt,
  });
  const result = await chatModel.generateContent(userMessage);
  return result.response.text();
}
