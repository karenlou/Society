import { NextResponse } from 'next/server';

// Simulate in-memory database for tracking simulations
const simulationsStore: Record<string, {
  startTime: number;
  status: 'processing' | 'completed';
  result?: any;
}> = {};

export async function GET(request: Request, { params }: { params: { simulation_id: string } }) {
  try {
    const { simulation_id } = params;
    
    if (!simulation_id) {
      return NextResponse.json(
        { error: 'Missing simulation_id' },
        { status: 400 }
      );
    }
    
    // Check if we have this simulation in our "store"
    if (!simulationsStore[simulation_id]) {
      // If not found, assume it's a new simulation and create an entry
      simulationsStore[simulation_id] = {
        startTime: Date.now(),
        status: 'processing'
      };
    }
    
    const simulation = simulationsStore[simulation_id];
    const elapsedSeconds = Math.floor((Date.now() - simulation.startTime) / 1000);
    
    // Simulate that simulations complete after 10 seconds
    if (elapsedSeconds >= 10 && simulation.status === 'processing') {
      // Mark as completed and generate a result
      simulation.status = 'completed';
      
      // Generate a random overall score between -5 and 5
      const overallScore = parseFloat((Math.random() * 10 - 5).toFixed(1));
      
      // Determine interpretation based on score
      let interpretation = "Neutral";
      if (overallScore > 4) interpretation = "Strong Kamala Victory";
      else if (overallScore > 2) interpretation = "Moderate Kamala Victory";
      else if (overallScore > 0) interpretation = "Slight Kamala Victory";
      else if (overallScore === 0) interpretation = "Tie";
      else if (overallScore > -2) interpretation = "Slight Trump Victory";
      else if (overallScore > -4) interpretation = "Moderate Trump Victory";
      else interpretation = "Strong Trump Victory";
      
      // Generate chunk progression data
      const chunkCount = Math.floor(Math.random() * 5) + 3; // 3-7 chunks
      const chunkProgression = Array.from({ length: chunkCount }, (_, i) => {
        // Generate a score for this chunk
        const score = parseFloat((Math.random() * 10 - 5).toFixed(1));
        
        return {
          chunk_id: `chunk-${i + 1}`,
          average_score: score,
          score_distribution: [], // Simplified for this example
          key_reactions: [] // Simplified for this example
        };
      });
      
      // Generate demographic breakdowns
      const demographicBreakdowns = {
        by_age: {
          "18-24": parseFloat((Math.random() * 10 - 5).toFixed(1)),
          "25-34": parseFloat((Math.random() * 10 - 5).toFixed(1)),
          "35-49": parseFloat((Math.random() * 10 - 5).toFixed(1)),
          "50-64": parseFloat((Math.random() * 10 - 5).toFixed(1)),
          "65+": parseFloat((Math.random() * 10 - 5).toFixed(1))
        },
        by_political_leaning: {
          "liberal": parseFloat((Math.random() * 5 + 2).toFixed(1)), // Bias toward Kamala
          "moderate": parseFloat((Math.random() * 6 - 3).toFixed(1)),
          "conservative": parseFloat((Math.random() * 5 - 5).toFixed(1)) // Bias toward Trump
        }
      };
      
      // Save the generated result
      simulation.result = {
        global_results: {
          overall_score: overallScore,
          interpretation,
          confidence: parseFloat((Math.random() * 0.3 + 0.6).toFixed(2)) // 0.6-0.9
        },
        chunk_progression: chunkProgression,
        demographic_breakdowns: demographicBreakdowns
      };
    }
    
    // Calculate percent complete for processing simulations
    let percentComplete;
    if (simulation.status === 'processing') {
      // Simulate 10 second processing time
      percentComplete = Math.min(Math.floor(elapsedSeconds / 10 * 100), 99);
    } else {
      percentComplete = 100;
    }
    
    // Prepare the response based on simulation status
    const response: any = {
      simulation_id,
      status: simulation.status,
    };
    
    if (simulation.status === 'processing') {
      response.percent_complete = percentComplete;
      response.estimated_completion_time = `${Math.max(10 - elapsedSeconds, 0)} seconds`;
    } else if (simulation.status === 'completed' && simulation.result) {
      // Include the complete results for completed simulations
      Object.assign(response, simulation.result);
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error getting simulation results:', error);
    return NextResponse.json(
      { error: 'Failed to get simulation results' },
      { status: 500 }
    );
  }
} 