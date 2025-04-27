'use client';

import { useState, useEffect, useRef } from 'react';

// Simulation data types from mock data
type ChunkScore = {
  chunk_id: number;
  score: number;
};

type ChunkAgentScores = {
  agent_id: string;
  scores: number[];
};

// Sample data for 20 agents
const mockAgentData = {
  corpus_id: "sample-corpus-123",
  axis_ends: ["Negative Sentiment", "Positive Sentiment"],
  chunk_count: 5, // Use this for slider max
  chunk_scores: [
    { chunk_id: 1, score: 0.2 },
    { chunk_id: 2, score: -0.3 },
    { chunk_id: 3, score: 0.5 },
    { chunk_id: 4, score: -0.1 },
    { chunk_id: 5, score: 0.7 }
  ],
  agent_chunk_scores: [ // Use this for agent positions
    { agent_id: "agent-1", scores: [-0.8, 0.1, -0.6, 0.2, -0.4, 0.5] },
    { agent_id: "agent-2", scores: [0.4, -0.3, 0.5, 0.7, 0.0, -0.2] },
    { agent_id: "agent-3", scores: [-0.3, -0.5, -0.2, -0.4, -0.6, -0.7] },
    { agent_id: "agent-4", scores: [0.9, 0.6, 0.95, 0.5, 0.85, 0.8] },
    { agent_id: "agent-5", scores: [-0.6, -0.4, -0.7, -0.1, -0.5, -0.55] },
    { agent_id: "agent-6", scores: [0.2, 0.4, 0.1, 0.3, 0.2, 0.25] },
    { agent_id: "agent-7", scores: [0.7, 0.4, 0.75, 0.3, 0.65, 0.7] },
    { agent_id: "agent-8", scores: [-0.4, 0.0, -0.5, -0.3, -0.4, -0.45] },
    { agent_id: "agent-9", scores: [0.5, 0.7, 0.4, 0.6, 0.5, 0.55] },
    { agent_id: "agent-10", scores: [0.0, -0.1, 0.1, -0.2, -0.1, -0.05] },
    { agent_id: "agent-11", scores: [0.75, 0.85, 0.65, 0.75, 0.95, 0.9] },
    { agent_id: "agent-12", scores: [-0.7, -0.8, -0.6, -0.7, -0.9, -0.85] },
    { agent_id: "agent-13", scores: [0.3, 0.0, 0.4, 0.1, -0.1, 0.0] },
    { agent_id: "agent-14", scores: [-0.5, -0.6, -0.4, -0.5, -0.7, -0.65] },
    { agent_id: "agent-15", scores: [0.6, 0.3, 0.65, 0.4, 0.2, 0.25] },
    { agent_id: "agent-16", scores: [-0.1, -0.2, 0.0, -0.1, -0.3, -0.25] },
    { agent_id: "agent-17", scores: [0.95, 0.8, 1.0, 0.85, 0.75, 0.8] },
    { agent_id: "agent-18", scores: [-0.9, -0.95, -0.8, -0.85, -1.0, -0.98] },
    { agent_id: "agent-19", scores: [0.1, 0.2, -0.0, 0.1, 0.3, 0.25] },
    { agent_id: "agent-20", scores: [0.4, 0.1, 0.5, 0.2, 0.0, 0.05] }
  ],
  aggregated_score: 0.2
};

// Helper function to map score (-1 to 1) to X percentage (0 to 100)
const scoreToX = (score: number) => (score + 1) * 50;

// Type for HSL color
type HSLColor = { h: number; s: number; l: number };

// Type for intermediate agent representation during stacking
type InitialAgent = {
  id: string;
  scores: number[];
  initialX: number;
  y: number; // Temporary Y for calculation
  color: HSLColor;
  size: number;
};

// Final Agent type
type Agent = {
  id: string;
  scores: number[];
  baseY: number; // The fixed Y calculated during stacking
  targetY: number; // The target Y position at progress = chunkCount
  color: HSLColor;
  size: number;
  // For X drift animation
  currentX: number;
  targetX: number;
  // For Y avoidance positioning
  currentY: number; // Current Y position including avoidance adjustments
};

// Function to calculate target X based on progress
const calculateTargetX = (agent: Agent | InitialAgent, progress: number): number => {
  const sliderValue = progress;
  const index1 = Math.floor(sliderValue);
  const index2 = Math.ceil(sliderValue);
  const t = sliderValue - index1;

  const safeIndex1 = Math.max(0, Math.min(index1, agent.scores.length - 1));
  const safeIndex2 = Math.max(0, Math.min(index2, agent.scores.length - 1));

  const score1 = agent.scores[safeIndex1];
  const score2 = agent.scores[safeIndex2];

  if (typeof score1 !== 'number' || typeof score2 !== 'number') {
    console.warn(`Invalid scores for agent ${agent.id} at indices ${safeIndex1}, ${safeIndex2}`);
    return scoreToX(agent.scores[0]);
  }

  const currentScore = score1 + (score2 - score1) * t;
  return scoreToX(currentScore);
};

// Helper function to generate a random HSL color
const getRandomHSLColor = (): HSLColor => ({
  h: Math.random() * 360,
  s: 65 + Math.random() * 25,
  l: 60 + Math.random() * 15,
});

export default function DataVizSwarmPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [progress, setProgress] = useState(0);
  const chunkCount = mockAgentData.chunk_count;
  const animationFrameRef = useRef<number | null>(null);

  // 1. Initialize agents (stacking determines baseY, includes variation)
  useEffect(() => {
    const agentSourceData = mockAgentData.agent_chunk_scores;

    let initialAgents: InitialAgent[] = agentSourceData.map((agentScore) => ({
      id: agentScore.agent_id,
      scores: agentScore.scores,
      initialX: scoreToX(agentScore.scores[0]),
      y: 50,
      color: getRandomHSLColor(),
      size: 25 + Math.random() * 20,
    }));

    initialAgents = initialAgents.sort((a, b) => a.initialX - b.initialX);

    const placedAgents: Agent[] = [];
    const collisionRadius = 1; // Reduced radius for tighter stacking check
    const verticalSpacing = 2; // REDUCED spacing significantly for less initial variation

    initialAgents.forEach((agentToPlace) => {
      let potentialY = 50;
      let placed = false;
      let attempts = 0;
      const maxPlacementAttempts = 50; // Limit attempts to prevent excessive spread

      while (!placed && attempts < maxPlacementAttempts) {
        attempts++;
        let collision = false;
        for (const placedAgent of placedAgents) {
           const otherInitialAgent = initialAgents.find(a => a.id === placedAgent.id);
           if (!otherInitialAgent) continue;

           // Check X proximity first (more efficient)
           if (Math.abs(otherInitialAgent.initialX - agentToPlace.initialX) < collisionRadius + (placedAgent.size / 2) + (agentToPlace.size / 2)) {
             // If close on X, check Y overlap
            const distanceY = Math.abs(placedAgent.baseY - potentialY);
            // Use size for minimum distance, plus the smaller verticalSpacing
            const minDistance = (placedAgent.size / 2) + (agentToPlace.size / 2) + verticalSpacing;
            if (distanceY < minDistance) {
              collision = true;
              break;
            }
          }
        }

        if (!collision) {
          const initialXPos = agentToPlace.initialX;
          const finalBaseY = potentialY;
          // Calculate targetY: small random offset from baseY
          const targetY = finalBaseY + (Math.random() * 10 - 5); // e.g., +/- 5% variance

          placedAgents.push({
            id: agentToPlace.id,
            scores: agentToPlace.scores,
            baseY: finalBaseY, // Initial Y
            targetY: targetY,  // Target Y at end
            color: agentToPlace.color,
            size: agentToPlace.size,
            currentX: initialXPos,
            targetX: initialXPos,
            currentY: finalBaseY, // Start currentY at baseY
          });
          placed = true;
        } else {
           // Try next Y position closer to the center
           const step = verticalSpacing + (attempts * 0.1); // Smaller step increments
           if (attempts % 2 === 1) {
               potentialY += step;
               // Limit spread from center
               if (potentialY > 70) potentialY = 50 - step; // Bias back towards center
           } else {
               potentialY -= step;
               if (potentialY < 30) potentialY = 50 + step; // Bias back towards center
           }
        }
      }
      // Fallback if placement fails after many attempts (place near center)
      if (!placed) {
           console.warn("Stacking fallback (tight placement) for agent:", agentToPlace.id);
           const initialXPos = agentToPlace.initialX;
           const finalBaseY = 50 + (Math.random() * 6 - 3); // Place very close to center
           const targetY = finalBaseY + (Math.random() * 10 - 5);
           placedAgents.push({
             id: agentToPlace.id,
             scores: agentToPlace.scores,
             baseY: finalBaseY,
             targetY: targetY,
             color: agentToPlace.color,
             size: agentToPlace.size,
             currentX: initialXPos,
             targetX: initialXPos,
             currentY: finalBaseY,
           });
      }
    });

    setAgents(placedAgents);

  }, [chunkCount]);

  // 2. Update Target X when slider progress changes
  useEffect(() => {
    setAgents(prevAgents =>
      prevAgents.map(agent => ({
        ...agent,
        targetX: calculateTargetX(agent, progress)
      }))
    );
  }, [progress]);


   // 3. Animation Loop (Optimized state update, X/Y Drift, Avoidance)
   useEffect(() => {
    const easeFactorX = 0.05;
    const easeFactorY = 0.04;
    const driftThreshold = 0.05;
    const avoidanceStrength = 0.25;

    let isActive = true; // Flag to control animation loop

    const animate = (timestamp: number) => {
      if (!isActive) return; // Stop loop if flag is false

      const currentProgressRatio = chunkCount > 0 ? progress / chunkCount : 0;

      setAgents(prevAgents => {
          // --- Calculate Next Positions Based on Previous State ---
          const nextPositions = prevAgents.map(agentA => {
              // Target Y interpolation
              const interpolatedTargetY = agentA.baseY + (agentA.targetY - agentA.baseY) * currentProgressRatio;

              // Calculate drift for this agent
              let nextX = agentA.currentX;
              let nextY = agentA.currentY;

              const diffY = interpolatedTargetY - agentA.currentY;
              nextY += diffY * easeFactorY;

              const diffX = agentA.targetX - agentA.currentX;
              if (Math.abs(diffX) > driftThreshold) {
                  nextX += diffX * easeFactorX;
              } else if (Math.abs(diffX) > 0) {
                  nextX = agentA.targetX; // Snap
              }

              // Calculate avoidance based on *previous* frame positions (prevAgents)
              // Avoidance is calculated relative to the agent's position *before* drift is applied for simplicity this frame
              // Or, more accurately, calculate drift first, then calculate avoidance based on intermediate drifted positions. Let's do the latter.
              let intermediateX = nextX;
              let intermediateY = nextY;

              let avoidanceDX = 0;
              let avoidanceDY = 0;

              for (const agentB of prevAgents) { // Check against all others in previous state
                  if (agentA.id === agentB.id) continue;

                  // Calculate distance based on where agents *would* drift without avoidance
                  // This prevents oscillation issues slightly better
                  // We need agentB's intermediate position too (let's approximate or simplify)
                  // Simplification: check against agentB's *previous* position for now.
                  const dx = intermediateX - agentB.currentX;
                  const dy = intermediateY - agentB.currentY;
                  const distSq = dx * dx + dy * dy;

                  const avoidanceRadiusA = agentA.size * 0.6;
                  const avoidanceRadiusB = agentB.size * 0.6;
                  const totalAvoidanceRadius = avoidanceRadiusA + avoidanceRadiusB;
                  const totalAvoidanceRadiusSq = totalAvoidanceRadius * totalAvoidanceRadius;

                  if (distSq < totalAvoidanceRadiusSq && distSq > 0.001) {
                      const dist = Math.sqrt(distSq); // Only calculate sqrt when needed
                      const overlap = totalAvoidanceRadius - dist;
                      const forceMagnitude = (overlap / dist) * avoidanceStrength;
                      avoidanceDX += (dx / dist) * forceMagnitude;
                      avoidanceDY += (dy / dist) * forceMagnitude;
                  }
              }

              // Apply avoidance displacement to the drifted position
              nextX += avoidanceDX;
              nextY += avoidanceDY;

              // Boundary checks
              nextX = Math.max(agentA.size * 0.05, Math.min(100 - agentA.size * 0.05, nextX)); // Simplified boundary
              nextY = Math.max(agentA.size * 0.05, Math.min(100 - agentA.size * 0.05, nextY)); // Simplified boundary

              // Return the calculated next state for this agent
              return {
                  ...agentA, // Spread previous agent to keep non-animated properties
                  currentX: nextX,
                  currentY: nextY,
                  // targetX remains the same as updated in the other useEffect
              };
          }); // End map

          return nextPositions; // Update state with the fully calculated new positions
      }); // End setAgents

      animationFrameRef.current = requestAnimationFrame(animate);
    }; // End animate function

    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      isActive = false; // Set flag to stop the loop
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
   }, [progress, chunkCount]); // Dependencies remain the same


  // 4. Render the page (Light Theme, No CSS position transition)
  return (
    <div className="min-h-screen flex flex-col items-center p-0 m-0 bg-gradient-to-br from-gray-50 to-blue-50 overflow-hidden">
      <h1 className="text-4xl font-bold mb-4 text-center text-gray-700 mt-8">
        Agent Sentiment Swarm (Optimized)
      </h1>
      <p className="text-gray-500 text-lg mb-8 text-center">
        Slide to observe agent sentiment shift across chunks (0 to {chunkCount})
      </p>

      <div className="relative w-full h-[600px] bg-transparent border-t border-b border-gray-200">
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gray-300" />
        <div className="absolute top-1/2 left-4 transform -translate-y-8 text-sm text-gray-500 font-medium">{mockAgentData.axis_ends[0]}</div>
        <div className="absolute top-1/2 right-4 transform -translate-y-8 text-sm text-gray-500 font-medium">{mockAgentData.axis_ends[1]}</div>

        {agents.map((agent) => {
          const targetScore = (agent.targetX / 50) - 1;
          const colorString = `hsl(${agent.color.h.toFixed(1)}, ${agent.color.s.toFixed(1)}%, ${agent.color.l.toFixed(1)}%)`;

          return (
            <div
              key={agent.id}
              className="absolute rounded-full"
              style={{
                width: `${agent.size}px`,
                height: `${agent.size}px`,
                backgroundColor: colorString,
                left: `${agent.currentX}%`,
                top: `${agent.currentY}%`,
                transform: `translate(-50%, -50%)`,
                zIndex: Math.round(agent.size),
                boxShadow: `0 1px 3px rgba(0,0,0,0.2)`,
                opacity: 0.9,
                // REMOVED left/top transition, kept background-color
                transition: 'background-color 0.2s ease-in-out',
              }}
               title={`Agent: ${agent.id}\nTarget Score: ${targetScore.toFixed(2)}\nColor: ${colorString}`}
            />
          );
        })}
      </div>

      {/* Slider (Light Theme) */}
      <div className="mt-8 w-3/4 sm:w-1/2 flex flex-col items-center">
         <div className="w-full flex justify-between text-sm text-gray-600 mb-1 px-1 font-medium">
           <span>Chunk 0</span>
           <span>Chunk {chunkCount}</span>
         </div>
        <input
          type="range"
          min={0}
          max={chunkCount}
          step={0.05}
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider-thumb-light"
        />
         <div className="text-sm text-gray-700 mt-2">
           Current Chunk Progression: {progress.toFixed(2)}
         </div>
      </div>
       <div className="h-16"></div>
       <style jsx>{`
         .slider-thumb-light::-webkit-slider-thumb {
           -webkit-appearance: none;
           appearance: none;
           width: 20px;
           height: 20px;
           background: #2a9d8f;
           border-radius: 50%;
           cursor: pointer;
           border: 1px solid #ccc;
         }
         .slider-thumb-light::-moz-range-thumb {
           width: 20px;
           height: 20px;
           background: #2a9d8f;
           border-radius: 50%;
           cursor: pointer;
           border: 1px solid #ccc;
         }
       `}</style>
    </div>
  );
}
