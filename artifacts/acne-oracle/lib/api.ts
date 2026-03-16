import { fetch } from "expo/fetch";

const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

export async function analyzeAcneSkin(base64Image: string): Promise<{
  acneType: string;
  severity: number;
  description: string;
  recommendations: string[];
  triggerProducts: string[];
  alternativeProducts: string[];
  routine: string[];
}> {
  const response = await fetch(`${BASE_URL}/acne/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64Image }),
  });

  if (!response.ok) {
    throw new Error("Analysis failed");
  }

  return response.json();
}

export async function generateSimulation(base64Image: string, weeks: number): Promise<{
  simulatedImage: string;
  message: string;
}> {
  const response = await fetch(`${BASE_URL}/acne/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64Image, weeks }),
  });

  if (!response.ok) {
    throw new Error("Simulation failed");
  }

  return response.json();
}

export async function chatWithAI(message: string, history: { role: string; content: string }[]): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(`${BASE_URL}/acne/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });

  if (!response.ok || !response.body) {
    throw new Error("Chat failed");
  }

  return response.body;
}
