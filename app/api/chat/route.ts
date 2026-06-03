// app/api/chat/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, systemPrompt, vaultContext } = await req.json();

    // 🧠 AUTONOMOUS MEMORY PROTOCOL
    const memoryInstructions = `
[KNOWLEDGE VAULT CONTEXT]:
You have access to long-term memory. Here is what you currently know about the user:
${vaultContext || "No long-term memories saved yet."}

[MEMORY EXTRACTION DIRECTIVE]:
You must automatically decide if the user shares a permanent, important fact about themselves (e.g., names, preferences, health, relationships, locations). 
If they do, you MUST silently append this exact format at the very end of your response: [[SAVE: [The fact to remember]]]
Example: If the user says "My dog's name is Buster", you respond normally, but end with: [[SAVE: The user's dog is named Buster.]]
Never acknowledge the [[SAVE]] tag verbally to the user.`;

    const defaultPrompt = "You are VEXA, a highly intelligent female AI assistant. You excel at coding, solving math problems, and analyzing images. You have live web access. You are witty, brilliant, professional, and slightly sarcastic.";
    const finalPrompt = (systemPrompt || defaultPrompt) + "\n\n" + memoryInstructions;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openrouter/free", 
        messages: [
          { role: "system", content: finalPrompt },
          ...messages
        ],
        tools: [
          { type: "openrouter:web_search" }
        ]
      }),
    });

    if (!response.ok) throw new Error("API Network Error");
    
    const data = await response.json();
    return NextResponse.json({ text: data.choices[0].message.content });
    
  } catch (error) {
    console.error("VEXA Core Error:", error);
    return NextResponse.json({ error: "Neural matrix failure" }, { status: 500 });
  }
}