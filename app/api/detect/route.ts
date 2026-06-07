import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // Call Sapling's Free AI Detector API
    const response = await fetch('https://api.sapling.ai/api/v1/aidetect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            key: process.env.SAPLING_API_KEY || '',
            text: text
        })
    });

    if (!response.ok) {
        throw new Error(`Sapling API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Sapling returns a float score between 0 and 1 (e.g., 0.982)
    // Convert it to a rounded whole percentage (e.g., 98)
    const rawScore = data.score || 0;
    const actualPercentage = Math.round(rawScore * 100);

    return NextResponse.json({ 
        success: true, 
        aiProbability: actualPercentage 
    });

  } catch (error) {
    console.error("AI Detection Error:", error);
    return NextResponse.json({ error: "Detection failed" }, { status: 500 });
  }
}