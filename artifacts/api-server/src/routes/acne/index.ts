import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.post("/analyze", async (req, res) => {
  const { image, userProfile } = req.body as {
    image: string;
    userProfile?: {
      nickname: string;
      skinTone: string;
      yearsWithAcne: number;
      currentCream: string;
      annualSpend: number;
    };
  };

  if (!image) {
    res.status(400).json({ error: "Image required" });
    return;
  }

  const profileContext = userProfile
    ? `User profile: Nickname: ${userProfile.nickname}, Skin tone: ${userProfile.skinTone}, Years with acne: ${userProfile.yearsWithAcne}, Current main product: "${userProfile.currentCream}", Annual skincare spend: $${userProfile.annualSpend}.`
    : "";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `You are AcneOracle, an expert AI dermatology wellness coach. ${profileContext}

IMPORTANT DISCLAIMER: You are a wellness tool, not a medical doctor. Always remind users to see a dermatologist for medical concerns.

Analyze the skin image and return a JSON object with these exact fields:
- acneType: one of "comedonal", "inflammatory", "cystic", "hormonal", "mixed", "unknown"
- severity: number 1-5 (1=clear/minimal, 5=severe)
- description: 2-3 warm, encouraging sentences describing what you observe
- recommendations: array of 4-5 specific actionable tips tailored to their skin tone and situation
- triggerProducts: array of ingredient types or products that may worsen acne (reference their current product if relevant)
- alternativeProducts: array of specific affordable product recommendations (CeraVe, The Ordinary, La Roche-Posay etc. with prices)
- routine: array of 4-6 morning/evening routine steps
- personalizedInsight: 2-3 warm sentences specifically referencing their ${userProfile ? `${userProfile.yearsWithAcne} years of struggle, their current use of "${userProfile.currentCream}", and their $${userProfile.annualSpend} annual spend — give honest, kind insight about whether their current product is likely helping or hurting, and what they could save by switching` : "personal journey"}

Be warm, specific, empowering. Focus on science-backed advice tailored to their skin tone.
Return ONLY valid JSON, no markdown.`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${image}`, detail: "high" },
            },
            { type: "text", text: "Please analyze this skin photo and return the JSON analysis." },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {
        acneType: "unknown",
        severity: 1,
        description: "Unable to analyze the image clearly. Please try a well-lit photo closer to your face.",
        recommendations: ["Ensure good lighting", "Take photo facing forward", "Remove any obstructions"],
        triggerProducts: [],
        alternativeProducts: ["CeraVe Hydrating Cleanser", "The Ordinary Niacinamide 10% + Zinc 1%"],
        routine: ["Gentle cleanse morning", "Moisturize", "SPF protection"],
        personalizedInsight: "I couldn't quite read your skin in this photo. Please try again with better lighting!",
      };
    }

    res.json(parsed);
  } catch (err) {
    console.error("Analysis error:", err);
    res.status(500).json({ error: "Analysis failed" });
  }
});

router.post("/welcome", async (req, res) => {
  const { userProfile } = req.body as {
    userProfile: {
      nickname: string;
      skinTone: string;
      yearsWithAcne: number;
      currentCream: string;
      annualSpend: number;
    };
  };

  if (!userProfile) {
    res.status(400).json({ error: "userProfile required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 300,
      stream: true,
      messages: [
        {
          role: "system",
          content: `You are AcneOracle, a warm, empathetic AI skin wellness coach. Write a short, emotionally resonant welcome message for a new user based on their profile. Be like a supportive best friend who truly gets it. 3-4 sentences max. End with genuine encouragement. Do NOT mention being an AI. Do NOT use asterisks or markdown.`,
        },
        {
          role: "user",
          content: `My name is ${userProfile.nickname}. I've been dealing with acne for ${userProfile.yearsWithAcne} year${userProfile.yearsWithAcne !== 1 ? "s" : ""}. I mainly use "${userProfile.currentCream}" and I've spent about $${userProfile.annualSpend} on skincare in the last year. My skin tone is ${userProfile.skinTone}. Write me a warm, personal welcome message.`,
        },
      ],
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Welcome error:", err);
    res.write(`data: ${JSON.stringify({ error: "Failed" })}\n\n`);
    res.end();
  }
});

router.post("/simulate", async (req, res) => {
  const { image, weeks } = req.body as { image: string; weeks: number };

  if (!image) {
    res.status(400).json({ error: "Image required" });
    return;
  }

  try {
    const prompt = `A realistic before-and-after skin comparison. The after photo shows the same face but with significantly clearer skin after ${weeks} weeks of a consistent skincare routine. The skin appears less inflamed, with reduced acne, smaller pores, and a more even skin tone. Photorealistic, natural lighting, same person.`;

    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      n: 1,
    });

    const b64 = (response.data?.[0] as any)?.b64_json;
    res.json({ simulatedImage: b64, message: `This is how your skin could look after ${weeks} weeks of consistent care!` });
  } catch (err) {
    console.error("Simulation error:", err);
    res.status(500).json({ error: "Simulation failed" });
  }
});

router.post("/chat", async (req, res) => {
  const { message, history, userProfile } = req.body as {
    message: string;
    history: { role: string; content: string }[];
    userProfile?: {
      nickname: string;
      skinTone: string;
      yearsWithAcne: number;
      currentCream: string;
      annualSpend: number;
    };
  };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const profileContext = userProfile
    ? `You are speaking with ${userProfile.nickname}, who has had acne for ${userProfile.yearsWithAcne} years, has ${userProfile.skinTone} skin, currently uses "${userProfile.currentCream}", and has spent $${userProfile.annualSpend} on skincare this year. Personalise your advice to them.`
    : "";

  try {
    const messages: any[] = [
      {
        role: "system",
        content: `You are AcneOracle, an expert AI skincare wellness coach with deep knowledge of acne, dermatology, skincare ingredients, and global skincare routines. ${profileContext}

IMPORTANT DISCLAIMER: You are a wellness coach, NOT a medical doctor. Always remind users to see a dermatologist for medical concerns.

You provide science-backed skincare advice, product recommendations (focus on affordable: CeraVe, The Ordinary, La Roche-Posay, Cetaphil, Neutrogena), acne trigger identification (dairy, sugar, stress, hormones), ingredient analysis, routine optimisation, and emotional support. Be warm, specific, and empowering. Keep responses concise (2-4 sentences) unless detail is needed. Do not use markdown asterisks.`,
      },
      ...history.slice(-10).map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 1024,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Chat error:", err);
    res.write(`data: ${JSON.stringify({ error: "Chat failed" })}\n\n`);
    res.end();
  }
});

export default router;
