import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { simulation_id: string } }) {
  try {
    const { simulation_id } = params;
    
    if (!simulation_id) {
      return NextResponse.json(
        { error: 'Missing simulation_id' },
        { status: 400 }
      );
    }
    
    // Generate a list of random agents
    const agentCount = Math.floor(Math.random() * 5) + 3; // 3-7 agents for demo
    const agents = Array.from({ length: agentCount }, (_, i) => {
      // Generate random persona data
      const age = Math.floor(Math.random() * 70) + 18; // 18-87
      
      const genders = ['male', 'female', 'non-binary'];
      const gender = genders[Math.floor(Math.random() * genders.length)];
      
      const races = ['white', 'black', 'hispanic', 'asian', 'other'];
      const race = races[Math.floor(Math.random() * races.length)];
      
      const incomes = ['low', 'middle', 'high'];
      const income = incomes[Math.floor(Math.random() * incomes.length)];
      
      const educations = ['high_school', 'college', 'graduate'];
      const education = educations[Math.floor(Math.random() * educations.length)];
      
      const politicalLeanings = ['liberal', 'moderate', 'conservative'];
      const politicalLeaning = politicalLeanings[Math.floor(Math.random() * politicalLeanings.length)];
      
      const regions = ['northeast', 'midwest', 'south', 'west', 'southwest'];
      const region = regions[Math.floor(Math.random() * regions.length)];
      
      // Generate a final score (-10 to 10)
      const finalScore = parseFloat((Math.random() * 20 - 10).toFixed(1));
      
      // Generate progression data
      const chunkCount = Math.floor(Math.random() * 3) + 2; // 2-4 chunks
      const progression = Array.from({ length: chunkCount }, (_, j) => {
        // Generate reactions based on political leaning
        let baseReaction: string;
        if (politicalLeaning === 'liberal') {
          baseReaction = ['Impressed by economic proposal', 'Agrees with healthcare policy', 'Appreciates climate focus', 'Supportive of education plan'][Math.floor(Math.random() * 4)];
        } else if (politicalLeaning === 'conservative') {
          baseReaction = ['Concerned about fiscal impact', 'Skeptical of government expansion', 'Prefers market-based solutions', 'Questions implementation details'][Math.floor(Math.random() * 4)];
        } else {
          baseReaction = ['Considering both perspectives', 'Weighing pros and cons', 'Seeking more information', 'Comparing with past policies'][Math.floor(Math.random() * 4)];
        }
        
        // Generate a score for this chunk
        let score: number;
        if (politicalLeaning === 'liberal') {
          // Liberals tend to score positive
          score = parseFloat((Math.random() * 10).toFixed(1));
        } else if (politicalLeaning === 'conservative') {
          // Conservatives tend to score negative
          score = parseFloat((Math.random() * -10).toFixed(1));
        } else {
          // Moderates have more varied responses
          score = parseFloat((Math.random() * 20 - 10).toFixed(1));
        }
        
        return {
          chunk_id: `chunk-${j + 1}`,
          score,
          reaction: baseReaction
        };
      });
      
      return {
        id: `agent-${i + 1}`,
        persona: {
          age,
          gender,
          race,
          income,
          education,
          political_leaning: politicalLeaning,
          region
        },
        final_score: finalScore,
        progression
      };
    });
    
    return NextResponse.json({ agents });
    
  } catch (error) {
    console.error('Error getting agent details:', error);
    return NextResponse.json(
      { error: 'Failed to get agent details' },
      { status: 500 }
    );
  }
} 