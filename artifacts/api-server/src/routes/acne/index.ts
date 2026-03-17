import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

interface UserProfile {
  nickname: string;
  age?: string;
  skinTone: string;
  acneTypes?: string[];
  yearsWithAcne: number;
  mainFrustration?: string;
  suspectedTriggers?: string[];
  currentCream: string;
  annualSpend: number;
}

function buildProfileContext(p: UserProfile): string {
  const types = p.acneTypes?.join(", ") || "general";
  const frustration = p.mainFrustration ? `Their main frustration is: "${p.mainFrustration}".` : "";
  const age = p.age ? `Age group: ${p.age}.` : "";
  const triggers = p.suspectedTriggers?.length ? `Suspected triggers: ${p.suspectedTriggers.join(", ")}.` : "";
  return `User: ${p.nickname}. ${age} Skin tone: ${p.skinTone}. Acne types: ${types}. Fighting acne for ${p.yearsWithAcne} year(s). ${frustration} ${triggers} Current main product: "${p.currentCream}". Annual skincare spend: $${p.annualSpend}.`;
}

router.post("/analyze", async (req, res) => {
  const { image, userProfile } = req.body as {
    image: string;
    userProfile?: UserProfile;
  };

  if (!image) {
    res.status(400).json({ error: "Image required" });
    return;
  }

  const profileContext = userProfile ? buildProfileContext(userProfile) : "";
  const name = userProfile?.nickname ?? "friend";
  const cream = userProfile?.currentCream ?? "their current product";
  const spend = userProfile?.annualSpend ?? 0;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 2048,
      messages: [
        {
          role: "system",
          content: `You are AcneOracle, a warm and expert AI skin wellness coach. ${profileContext}

Rules for every response:
- Always address ${name} by their name.
- Write in plain, warm, human sentences. No asterisks, no bullet-point markdown, no emoji overload.
- Be honest about their spending and their current product "${cream}" — if it appears ineffective or counterproductive based on their skin analysis, say so kindly but directly.
- Always include a disclaimer that you are a wellness tool, not a medical doctor.

Analyze the skin in the image and return a JSON object with exactly these fields:
- acneType: one of "comedonal", "inflammatory", "cystic", "hormonal", "mixed", "unknown"
- severity: integer 1-5 (1 = clear or minimal, 5 = severe)
- description: 2-3 warm, specific sentences about what you observe in ${name}'s skin.
- recommendations: array of 4-5 specific, actionable tips tailored to their skin tone and acne type.
- triggerProducts: array of ingredients or product types that may be worsening ${name}'s acne.
- alternativeProducts: array of 3-4 specific affordable products with prices (e.g. "CeraVe Foaming Cleanser – ~$12", "The Ordinary Niacinamide 10% + Zinc – $6").
- routine: array of 5-6 morning/evening routine steps for ${name}'s specific skin type.
- personalizedInsight: 2-3 honest, warm sentences addressing ${name} directly — reference their ${userProfile?.yearsWithAcne ?? 0} years of struggle, give an honest take on whether "${cream}" is likely helping or hurting based on what you see, and what they could realistically save from their $${spend} annual budget by making smarter swaps.
- spendingCritique: 1-2 plain sentences giving an honest critique of "${cream}" costing approximately $${Math.round(spend / 12)}/month — is it worth it based on the analysis? What's a better alternative with a rough price?

Return ONLY valid JSON with no markdown code fences.`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${image}`, detail: "high" },
            },
            {
              type: "text",
              text: `Please analyze ${name}'s skin and return the full JSON.`,
            },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown>;
    try {
      const clean = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = {
        acneType: "unknown",
        severity: 1,
        description: `${name}, I wasn't able to read your skin clearly in this photo. Please try with better lighting and your face filling the frame.`,
        recommendations: ["Ensure bright, natural lighting", "Face forward and fill the frame", "Remove glasses if possible"],
        triggerProducts: [],
        alternativeProducts: ["CeraVe Hydrating Cleanser (~$12)", "The Ordinary Niacinamide 10% + Zinc (~$6)"],
        routine: ["Gentle cleanse morning and evening", "Apply niacinamide", "Moisturise", "SPF every morning"],
        personalizedInsight: `${name}, I couldn't read your skin clearly this time — please retake the photo with better lighting!`,
        spendingCritique: "I need a clearer photo to give you honest feedback on your current product.",
      };
    }

    res.json(parsed);
  } catch (err) {
    console.error("Analysis error:", err);
    res.status(500).json({ error: "Analysis failed" });
  }
});

router.post("/welcome", async (req, res) => {
  const { userProfile } = req.body as { userProfile: UserProfile };

  if (!userProfile) {
    res.status(400).json({ error: "userProfile required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const name = userProfile.nickname;
  const years = userProfile.yearsWithAcne;
  const spend = userProfile.annualSpend;
  const cream = userProfile.currentCream;
  const frustration = userProfile.mainFrustration ?? "";
  const types = userProfile.acneTypes?.join(" and ") ?? "acne";
  const age = userProfile.age ?? "";

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 350,
      stream: true,
      messages: [
        {
          role: "system",
          content: `You are AcneOracle, a warm and emotionally intelligent AI skin wellness coach. Write a short, personal welcome message for a user who just finished onboarding. 

Rules:
- Always address ${name} by name.
- Be genuine, warm, and human — like a trusted friend who deeply understands their struggle.
- Reference their specific data: ${years} year(s) with acne, spending $${spend} on skincare, using "${cream}", main frustration: "${frustration}".
- No asterisks, no markdown, no bullet points, no excessive emojis.
- 3-4 natural sentences. End with something that genuinely motivates them.
- Do NOT mention being an AI.`,
        },
        {
          role: "user",
          content: `I'm ${name}, ${age ? age + " years old, " : ""}dealing with ${types} for ${years} year(s). I mainly use "${cream}" and I've spent about $${spend} on skincare this year. My biggest frustration is: "${frustration}". Please welcome me.`,
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
    const prompt = `A realistic skin improvement simulation. The same face but with significantly clearer skin after ${weeks} weeks of a consistent science-backed skincare routine. The skin appears less inflamed, with reduced acne blemishes, smaller pores, and a more even, healthy skin tone. Photorealistic, natural lighting, same person, same angle.`;

    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      n: 1,
    });

    const b64 = (response.data?.[0] as any)?.b64_json;
    res.json({
      simulatedImage: b64,
      message: `This is how your skin could look after ${weeks} weeks of consistent care. This is AI wellness simulation only — not a medical prediction. Please consult a dermatologist for medical advice.`,
    });
  } catch (err) {
    console.error("Simulation error:", err);
    res.status(500).json({ error: "Simulation failed" });
  }
});

router.post("/chat", async (req, res) => {
  const { message, history, userProfile } = req.body as {
    message: string;
    history: { role: string; content: string }[];
    userProfile?: UserProfile;
  };

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const name = userProfile?.nickname ?? "friend";
  const profileContext = userProfile
    ? `You are speaking with ${name}, age group ${userProfile.age ?? "unknown"}, who has had acne for ${userProfile.yearsWithAcne} year(s). They have ${userProfile.skinTone} skin, deal mainly with ${userProfile.acneTypes?.join(" and ") ?? "acne"}, and their biggest frustration is "${userProfile.mainFrustration ?? ""}". They currently use "${userProfile.currentCream}" and have spent $${userProfile.annualSpend} on skincare this year.`
    : "";

  try {
    const messages: any[] = [
      {
        role: "system",
        content: `You are AcneOracle, an expert AI skincare wellness coach with deep knowledge of dermatology, skincare ingredients, acne triggers, and global skincare routines. ${profileContext}

Rules for every reply:
- Always address ${name} by their name at least once.
- Write in plain, warm, human sentences. No asterisks, no markdown formatting, no excessive emojis.
- Be specific and honest. If their current product comes up, give your honest assessment.
- Focus on affordable brands: CeraVe, The Ordinary, La Roche-Posay, Cetaphil, Neutrogena.
- Keep replies concise (2-4 sentences) unless more detail is genuinely needed.
- Always end with a disclaimer on medical results screens: "This is AI wellness advice only — not a doctor. Please see a dermatologist for medical decisions."
- On medical questions, be clear you are a wellness tool, not a doctor.`,
      },
      ...history.slice(-10).map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
