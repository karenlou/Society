import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { corpus_id, insight_prompt } = await request.json();
    
    if (!corpus_id || !insight_prompt) {
      return NextResponse.json(
        { error: 'Missing corpus_id or insight_prompt' },
        { status: 400 }
      );
    }
    
    // Create possible axis options based on the insight prompt
    const axisOptions = [
      {
        description: "Trump Victory ←→ Kamala Victory",
        min_label: "Strong Trump Victory",
        max_label: "Strong Kamala Victory",
        neutral_label: "Tie"
      },
      {
        description: "Liberal Perspective ←→ Conservative Perspective",
        min_label: "Strong Liberal View",
        max_label: "Strong Conservative View",
        neutral_label: "Moderate View"
      },
      {
        description: "Economic Focus ←→ Social Focus",
        min_label: "Economy-Centered",
        max_label: "Social Issues-Centered",
        neutral_label: "Balanced View"
      }
    ];
    
    // Choose an axis based on prompt keywords
    let axisIndex = 0;
    
    if (insight_prompt.toLowerCase().includes('debate') || 
        insight_prompt.toLowerCase().includes('winner') || 
        insight_prompt.toLowerCase().includes('trump') || 
        insight_prompt.toLowerCase().includes('kamala')) {
      axisIndex = 0;
    } else if (insight_prompt.toLowerCase().includes('liberal') || 
               insight_prompt.toLowerCase().includes('conservative') || 
               insight_prompt.toLowerCase().includes('political')) {
      axisIndex = 1;
    } else if (insight_prompt.toLowerCase().includes('economic') || 
               insight_prompt.toLowerCase().includes('social') || 
               insight_prompt.toLowerCase().includes('issue')) {
      axisIndex = 2;
    }
    
    const selectedAxis = axisOptions[axisIndex];
    
    // Create a simulated response
    return NextResponse.json({
      axis_id: `axis-${Date.now()}`,
      description: selectedAxis.description,
      scale: {
        min: -10,
        max: 10,
        min_label: selectedAxis.min_label,
        max_label: selectedAxis.max_label,
        neutral_label: selectedAxis.neutral_label
      }
    });
    
  } catch (error) {
    console.error('Error generating axis:', error);
    return NextResponse.json(
      { error: 'Failed to generate axis' },
      { status: 500 }
    );
  }
} 