import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { corpus, title } = await request.json();
    
    if (!corpus || typeof corpus !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid corpus content' },
        { status: 400 }
      );
    }
    
    // In a real implementation, this would process the text
    // For now, we'll create a simulated response with chunks based on paragraphs
    
    // Simple chunking by paragraphs
    const paragraphs = corpus.split(/\n\s*\n/);
    const chunks = paragraphs.map((text, index) => ({
      id: `chunk-${index + 1}`,
      text: text.trim().substring(0, 150) + (text.length > 150 ? '...' : '')
    }));
    
    // Create a simulated response
    return NextResponse.json({
      corpus_id: `corpus-${Date.now()}`,
      chunks,
      total_chunks: chunks.length,
      status: "processed"
    });
    
  } catch (error) {
    console.error('Error processing corpus:', error);
    return NextResponse.json(
      { error: 'Failed to process corpus' },
      { status: 500 }
    );
  }
} 