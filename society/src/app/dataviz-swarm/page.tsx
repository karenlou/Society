'use client';

import { useState, useEffect } from 'react';

export default function DataVizSwarmPage() {
  // 1. Define what a dot (agent) looks like
  type Agent = {
    id: string;
    currentX: number;
    currentY: number;
    futureX: number;
    futureY: number;
    color: string;
    size: number;
  };

  // 2. State to hold the agents and progress
  const [agents, setAgents] = useState<Agent[]>([]);
  const [progress, setProgress] = useState(0);

  // 3. When the page loads, simulate backend data
  useEffect(() => {
    async function fetchAgentData() {
      try {
        // 🚀 Ready for real backend later:
        /*
        const response = await fetch('/api/axis');
        const data = await response.json();
        const agentChunkScores = data.agent_chunk_scores;
        */

        // 🧪 For now: simulated agent scores
        const agentChunkScores = [
          { agent_id: 'agent-1', scores: [-0.7] },
          { agent_id: 'agent-2', scores: [0.3] },
          { agent_id: 'agent-3', scores: [-0.2] },
          { agent_id: 'agent-4', scores: [0.8] },
          { agent_id: 'agent-5', scores: [-0.5] },
          { agent_id: 'agent-6', scores: [0.1] },
          { agent_id: 'agent-7', scores: [0.6] },
          { agent_id: 'agent-8', scores: [-0.9] },
          { agent_id: 'agent-9', scores: [0.4] },
          { agent_id: 'agent-10', scores: [-0.1] },
        ];

        const colors = ["#83D0DB", "#F0551F", "#7CA34C", "#FFBCB9", "#0B7FBA"];

        // Map agent scores
        let agents = agentChunkScores.map((agentScore) => ({
          id: agentScore.agent_id,
          currentX: (agentScore.scores[0] + 1) * 50,
          currentY: 50,
          futureX: Math.random() * 100,
          futureY: 50,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 10 + Math.random() * 20,
        }));

        // Swarm stacking
        agents = agents.sort((a, b) => a.currentX - b.currentX);

        const placedAgents: Agent[] = [];

        agents.forEach((agent) => {
          let y = 50;
          const spacing = 6;

          while (
            placedAgents.some(
              (other) =>
                Math.abs(other.currentX - agent.currentX) < 5 &&
                Math.abs(other.currentY - y) < spacing
            )
          ) {
            y += spacing;
          }

          placedAgents.push({
            ...agent,
            currentY: y,
            futureY: 45 + Math.random() * 10,
          });
        });

        setAgents(placedAgents);
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
    }

    fetchAgentData();
  }, []);

  // 4. Render the page
  return (
    <div className="min-h-screen flex flex-col items-center p-0 m-0 bg-gray-100">
      {/* Title */}
      <h1 className="text-4xl font-bold mb-4 text-center text-gray-800 mt-8">
        Swarm Visualization Page
      </h1>

      {/* Subtitle */}
      <p className="text-gray-600 text-lg mb-8 text-center">
        Dots cluster horizontally by score, now full-width! 🚀
      </p>

      {/* Full-screen canvas */}
      <div className="relative w-full h-[600px] bg-transparent">
        {/* X-Axis touching edges */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-black" />

        {/* Render agents */}
        {agents.map((agent) => {
          const x = agent.currentX + (agent.futureX - agent.currentX) * (progress / 100);
          const y = agent.currentY + (agent.futureY - agent.currentY) * (progress / 100);

          return (
            <div
              key={agent.id}
              className="absolute rounded-full transition-all duration-300"
              style={{
                width: `${agent.size}px`,
                height: `${agent.size}px`,
                backgroundColor: agent.color,
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          );
        })}
      </div>

      {/* Slider */}
      <div className="mt-8 w-3/4 sm:w-1/2">
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <span>Current</span>
          <span>Future</span>
        </div>
      </div>
    </div>
  );
}
