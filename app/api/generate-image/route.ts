import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  try {
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      { input: { prompt } }
    );
    // Tell TypeScript to treat 'output' as an array of strings
return NextResponse.json({ imageUrl: (output as string[])[0] });
  } catch (error) {
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}