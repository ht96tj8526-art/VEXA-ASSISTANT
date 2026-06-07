import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // Call the real RapidAPI Humanizer
    const response = await fetch('https://humanize-ai-tools.p.rapidapi.com/humanize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
            'X-RapidAPI-Host': 'humanize-ai-tools.p.rapidapi.com'
        },
        body: JSON.stringify({
            language: "english",
            paragraph: text
        })
    });

    if (!response.ok) {
        // Log the error detail from the API to your terminal
        const errorData = await response.text();
        console.error("RapidAPI Error Detail:", errorData);
        throw new Error(`RapidAPI Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Returns the rewritten text from the API response
    return NextResponse.json({ 
        success: true, 
        humanizedText: data.paragraph 
    });

  } catch (error) {
    console.error("Humanizer Error:", error);
    return NextResponse.json({ error: "Humanization failed" }, { status: 500 });
  }
}