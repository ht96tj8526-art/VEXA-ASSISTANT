import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    
    // We force the AI to act as a McKinsey-style consultant
    const prompt = `Create a professional presentation structure for the topic: "${topic}". 
    Use a 7-slide structure. Provide the output ONLY as a JSON object: { "title": "...", "slides": [ { "title": "...", "content": "..." } ] }. 
    Focus on clarity, executive summaries, and data-driven insights.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp:free",
        messages: [{ role: "system", content: prompt }]
      }),
    });

    const data = await response.json();
    const slidesData = JSON.parse(data.choices[0].message.content);
    return NextResponse.json({ slidesData });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate PPT" }, { status: 500 });
  }
}