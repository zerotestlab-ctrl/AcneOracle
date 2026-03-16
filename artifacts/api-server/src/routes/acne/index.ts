import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.post("/analyze", async (req, res) => {
  const { image } = req.body as { image: string };

  if (!image) {
    res.status(400).json({ error: "Image required" });
    return;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `You are an expert dermatology AI wellness coach analyzing skin photos for acne. 
IMPORTANT DISCLAIMER: Always note you are a wellness tool, not a medical doctor.
Analyze the skin image and return a JSON object with these exact fields:
- acneType: one of "comedonal", "inflammatory", "cystic", "hormonal", "mixed", "unknown"
- severity: number 1-5 (1=clear/minimal, 5=severe)
- description: 2-3 sentence description of what you observe
- recommendations: array of 4-5 specific actionable tips
- triggerProducts: array of ingredient types or products that may worsen acne
- alternativeProducts: array of specific affordable product recommendations (CeraVe, The Ordinary, La Roche-Posay etc.)
- routine: array of 4-6 morning/evening routine steps

Be encouraging, warm, and specific. Focus on science-backed advice.
Return ONLY valid JSON, no markdown.`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${image}`,
                detail: "high",
              },
            },
            {
              type: "text",
              text: "Please analyze this skin photo and return the JSON analysis.",
            },
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
      };
    }

    res.json(parsed);
  } catch (err) {
    console.error("Analysis error:", err);
    res.status(500).json({ error: "Analysis failed" });
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
  const { message, history } = req.body as {
    message: string;
    history: { role: string; content: string }[];
  };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const messages: any[] = [
      {
        role: "system",
        content: `You are AcneOracle, an expert AI skincare wellness coach with deep knowledge of acne, dermatology, skincare ingredients, and global skincare routines.

IMPORTANT DISCLAIMER: You are a wellness coach, NOT a medical doctor. Always remind users to see a dermatologist for medical concerns.

You provide:
- Science-backed skincare advice
- Product recommendations (focus on affordable brands: CeraVe, The Ordinary, La Roche-Posay, Cetaphil, Neutrogena)
- Acne trigger identification (dairy, sugar, stress, hormones)
- Ingredient analysis (what to avoid, what works)
- Routine optimization
- Encouragement and emotional support

Be warm, specific, and empowering. Keep responses concise (2-4 sentences) unless a detailed answer is needed.`,
      },
      ...history.slice(-10).map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 1024,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
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
