'use client';

import { useState, useEffect } from 'react';

export default function DataVizPage() {
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

  // 3. When the page loads, fetch or simulate backend data
  useEffect(() => {
    async function fetchAgentData() {
      // TODO: Replace this later with real fetch call
      // const response = await fetch('/api/axis');
      // const data = await response.json();

      // 👇 Simulated backend response structure
      const simulatedAgentChunkScores = [
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

      const agents = simulatedAgentChunkScores.map((agentScore, i) => ({
        id: agentScore.agent_id,
        // Map -1 to 0%, 1 to 100%
        currentX: (agentScore.scores[0] + 1) * 50,
        currentY: Math.random() * 100, // random Y for now
        futureX: Math.random() * 100,   // For fun: give random future position
        futureY: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 10 + Math.random() * 20,
      }));

      setAgents(agents);
    }

    fetchAgentData();
  }, []);

  // 4. Return the page
  return (
    <div className="min-h-screen flex flex-col items-center p-8 bg-gray-100">
      {/* Title */}
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">
        Data Visualization Page
      </h1>

      {/* Subtitle */}
      <p className="text-gray-600 text-lg mb-8">
        Welcome to the data visualization dashboard!
      </p>

      {/* CANVAS BOX */}
      <div className="relative w-full max-w-4xl h-[600px] bg-white border border-black">
        {/* X-Axis */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-black" />

        {/* Y-Axis */}
        <div className="absolute top-0 left-1/2 w-[2px] h-full bg-black" />

        {/* Render all the agents */}
        {agents.map((agent) => {
          // Calculate interpolated position based on progress
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
      <div className="mt-8 w-1/2">
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
