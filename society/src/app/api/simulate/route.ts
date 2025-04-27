import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { corpus_id, axis_id, agent_count, demographics } = await request.json();
    
    if (!corpus_id || !axis_id || !agent_count) {
      return NextResponse.json(
        { error: 'Missing required parameters: corpus_id, axis_id, or agent_count' },
        { status: 400 }
      );
    }
    
    // Validate agent_count
    if (typeof agent_count !== 'number' || agent_count <= 0 || agent_count > 100000) {
      return NextResponse.json(
        { error: 'Invalid agent_count. Must be a number between 1 and 100,000' },
        { status: 400 }
      );
    }
    
    // Simulate processing time based on agent count
    const estimatedSecondsToComplete = Math.ceil(agent_count / 1000); // 1 second per 1000 agents
    
    // Create a simulated response
    return NextResponse.json({
      simulation_id: `sim-${Date.now()}`,
      status: "processing",
      estimated_completion_time: `${estimatedSecondsToComplete} seconds`
    });
    
  } catch (error) {
    console.error('Error starting simulation:', error);
    return NextResponse.json(
      { error: 'Failed to start simulation' },
      { status: 500 }
    );
  }
} 