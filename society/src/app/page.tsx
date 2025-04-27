"use client"

import { useEffect, useState } from "react";

import Gravity, {
  MatterBody,
} from "@/fancy/components/physics/cursor-attractor-and-gravity"
import { TextInput } from '@/components/TextInput';
import {
  CorpusInput,
  AxisInput,
  SimulationInput,
  SimulationResults,
  submitCorpus,
  generateAxis,
  runSimulation,
  getSimulationResults,
  pollSimulationResults,
} from "@/lib/api";

type Circle = {
  size: number;
  color: string;
  x: number;
  y: number;
};

type ApiState = {
  corpusId?: string;
  axisId?: string;
  simulationId?: string;
  status: "idle" | "loading" | "success" | "error";
  result?: SimulationResults;
  error?: string;
};

export default function Home() {
  const [apiState, setApiState] = useState<ApiState>({
    status: "idle",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  const [vw, setVw] = useState<number | null>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [stage, setStage] = useState(0);
  const [showSociety, setShowSociety] = useState(false);
  const [showExplodingCircle, setShowExplodingCircle] = useState(false);
  const [startTransition, setStartTransition] = useState(false);

  useEffect(() => {
    const handleResize = () => setVw(window.innerWidth);
    handleResize();                  // set initial value
    window.addEventListener("resize", handleResize);   // optional
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (vw === null) return;
    const colors = [
      "#83D0DB", "#0B7FBA", "#DD850D", "#F0551F", "#008046",
      "#DECBDF", "#2F274D", "#7CA34C", "#F8D054", "#FFBCB9"
    ];
    const arr = Array.from({ length: 150 }).map(() => {
      const width = vw;
      const maxSize =
        width < 640   ? 20 :
        width < 768   ? 30 :
                        40;
      const minSize = width < 640 ? 10 : 20;
      const size = Math.max(minSize, Math.random() * maxSize);
      const color = colors[Math.floor(Math.random() * colors.length)];
      return {
        size,
        color,
        x: Math.random() * 100,
        y: Math.random() * 100,
      };
    });
    setCircles(arr);
  }, [vw]);

  useEffect(() => {
    let societyTimer: NodeJS.Timeout | undefined;
    let circleTimer: NodeJS.Timeout | undefined;
    let transitionTimer: NodeJS.Timeout | undefined;

    const stage1Timer = setTimeout(() => {
      setStage(1);
      
      societyTimer = setTimeout(() => {
        setShowSociety(true);

        circleTimer = setTimeout(() => {
          setShowExplodingCircle(true);
        }, 1000); 

      }, 1000); 

    }, 1000);

    const stage2Timer = setTimeout(() => {
      setStage(2);
      transitionTimer = setTimeout(() => {
        setStartTransition(true);
      }, 300);
    }, 4000);

    return () => {
      clearTimeout(stage1Timer);
      clearTimeout(societyTimer);
      clearTimeout(circleTimer);
      clearTimeout(stage2Timer);
      clearTimeout(transitionTimer);
    };
  }, []);

  const getBgColor = () => {
    if (!startTransition) return 'bg-black';
    return 'bg-white';
  };

  const getTextColor = (finalColor: string) => {
    if (!startTransition) return 'text-stone-200';
    return finalColor;
  };

  const showBotResponse = (content: string) => {
    setMessages(prev => [...prev, content].slice(-3)); // Keep last 3 messages only
  };

  const handleSubmitCorpus = async (text: string) => {
    showBotResponse("Processing your text...");
    setApiState(prev => ({ ...prev, status: "loading" }));
    
    try {
      if (text.length < 2) {
        showBotResponse("Please provide some text content for analysis.");
        setApiState(prev => ({ ...prev, status: "idle" }));
        return;
      }
      
      const corpusData: CorpusInput = {
        corpus: text,
        title: "User Submitted Text",
      };
      
      const response = await submitCorpus(corpusData);
      
      setApiState(prev => ({
        ...prev,
        corpusId: response.corpus_id,
        status: "success",
      }));
      
      showBotResponse(
        `Text processed successfully! Corpus ID: ${response.corpus_id}. You can now generate an axis for this text by saying "Generate an axis about [topic]".`
      );
    } catch (error) {
      console.error("Error submitting corpus:", error);
      showBotResponse(`Failed to process text: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setApiState(prev => ({ ...prev, status: "error", error: error instanceof Error ? error.message : 'Unknown error' }));
    }
  };

  const handleGenerateAxis = async (text: string) => {
    if (!apiState.corpusId) {
      showBotResponse("Please submit a text for analysis first.");
      return;
    }
    
    showBotResponse("Generating axis...");
    setApiState(prev => ({ ...prev, status: "loading" }));
    
    try {
      const promptRegex = /generate an axis (about|for|on) (.+)/i;
      const match = text.match(promptRegex);
      const axisPrompt = match ? match[2].trim() : "general sentiment";
      
      console.log(`Sending axis request with prompt: "${axisPrompt}"`);
      
      const axisData: AxisInput = {
        corpus_id: apiState.corpusId,
        axis_prompt: axisPrompt,
      };
      
      const response = await generateAxis(axisData);
      
      setApiState(prev => ({
        ...prev,
        axisId: response.axis_id,
        status: "success",
      }));
      
      let responseMessage = `Axis generated! ID: ${response.axis_id}`;
      
      if (response.axis_ends && response.axis_ends.length >= 2) {
        responseMessage += ` Spectrum: "${response.axis_ends[0]}" to "${response.axis_ends[1]}"`;
      }
      
      if (response.aggregated_score !== undefined) {
        responseMessage += ` Score: ${response.aggregated_score.toFixed(2)}`;
      }
      
      showBotResponse(responseMessage);
      showBotResponse("You can now run a simulation by saying 'Run a simulation with [number] agents'.");
    } catch (error) {
      console.error("Error generating axis:", error);
      showBotResponse(`Failed to generate axis: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setApiState(prev => ({ ...prev, status: "error", error: error instanceof Error ? error.message : 'Unknown error' }));
    }
  };

  const handleRunSimulation = async (text: string) => {
    if (!apiState.corpusId || !apiState.axisId) {
      showBotResponse("Please submit a text and generate an axis first.");
      return;
    }
    
    showBotResponse("Preparing to run simulation...");
    setApiState(prev => ({ ...prev, status: "loading" }));
    
    try {
      const agentCountRegex = /run a simulation with (\d+) agents/i;
      const match = text.match(agentCountRegex);
      const agentCount = match ? parseInt(match[1]) : 50;
      
      const simulationData: SimulationInput = {
        corpus_id: apiState.corpusId,
        axis_id: apiState.axisId,
        agent_count: agentCount,
        demographics: {
          age_groups: ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"],
          political_leanings: ["liberal", "moderate", "conservative"]
        }
      };
      
      const response = await runSimulation(simulationData);
      
      setApiState(prev => ({
        ...prev,
        simulationId: response.simulation_id,
        status: "loading",
      }));
      
      showBotResponse(`Simulation started! ID: ${response.simulation_id}`);
      showBotResponse("Polling for results. This may take a few minutes...");
      
      pollForResults(response.simulation_id);
    } catch (error) {
      console.error("Error running simulation:", error);
      showBotResponse(`Failed to run simulation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setApiState(prev => ({ ...prev, status: "error", error: error instanceof Error ? error.message : 'Unknown error' }));
    }
  };

  const handleCheckResults = async () => {
    if (!apiState.simulationId) {
      showBotResponse("No simulation has been run yet. Please run a simulation first.");
      return;
    }
    
    showBotResponse("Checking simulation results...");
    setApiState(prev => ({ ...prev, status: "loading" }));
    
    try {
      const results = await getSimulationResults(apiState.simulationId);
      
      if (results.status === "processing") {
        setApiState(prev => ({
          ...prev,
          status: "loading",
        }));
        
        showBotResponse(`Simulation is still processing. Current progress: ${results.percent_complete || 0}%`);
        
        pollForResults(apiState.simulationId);
      } else if (results.status === "completed") {
        setApiState(prev => ({
          ...prev,
          status: "success",
          result: results,
        }));
        
        formatAndDisplayResults(results);
      } else {
        showBotResponse(`Simulation encountered an error.`);
        setApiState(prev => ({ ...prev, status: "error", error: "Simulation failed" }));
      }
    } catch (error) {
      console.error("Error checking results:", error);
      showBotResponse(`Failed to check results: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setApiState(prev => ({ ...prev, status: "error", error: error instanceof Error ? error.message : 'Unknown error' }));
    }
  };

  const pollForResults = (simulationId: string) => {
    pollSimulationResults(
      simulationId,
      (progress) => {
        if (progress.status === "processing") {
          showBotResponse(`Simulation in progress... ${progress.percent_complete || 0}% complete`);
        }
      }
    )
      .then(() => {
        getSimulationResults(simulationId)
          .then((results) => {
            setApiState(prev => ({
              ...prev,
              status: "success",
              result: results,
            }));
            
            formatAndDisplayResults(results);
          })
          .catch((error) => {
            console.error("Error getting final results:", error);
            showBotResponse(`Failed to get final results: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setApiState(prev => ({ ...prev, status: "error", error: error instanceof Error ? error.message : 'Unknown error' }));
          });
      })
      .catch((error) => {
        console.error("Error polling for results:", error);
        showBotResponse(`Failed to poll for results: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setApiState(prev => ({ ...prev, status: "error", error: error instanceof Error ? error.message : 'Unknown error' }));
      });
  };

  const formatAndDisplayResults = (results: SimulationResults) => {
    const { global_results, demographic_breakdowns, key_reactions } = results;
    
    if (global_results) {
      showBotResponse(`Overall Score: ${global_results.overall_score.toFixed(2)} (Confidence: ${global_results.confidence.toFixed(2)})`);
      showBotResponse(`Interpretation: ${global_results.interpretation}`);
    }
    
    if (key_reactions && key_reactions.length > 0) {
      showBotResponse(`Key Reaction: ${key_reactions[0]}`);
    }
    
    if (demographic_breakdowns) {
      if (demographic_breakdowns.by_age) {
        const ageMessage = "Age breakdown: " + 
          Object.entries(demographic_breakdowns.by_age)
            .map(([age, score]) => `${age}: ${score.toFixed(2)}`)
            .join(", ");
        showBotResponse(ageMessage);
      }
      
      if (demographic_breakdowns.by_political_leaning) {
        const politicalMessage = "Political breakdown: " + 
          Object.entries(demographic_breakdowns.by_political_leaning)
            .map(([leaning, score]) => `${leaning}: ${score.toFixed(2)}`)
            .join(", ");
        showBotResponse(politicalMessage);
      }
    }
  };

  // Handler for the TextInput submission
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    console.log("Message submitted:", message);
    
    try {
      const lowerInput = message.toLowerCase();
      
      if (lowerInput.includes("analyze") || lowerInput.includes("text") || lowerInput.includes("corpus")) {
        await handleSubmitCorpus(message);
      } else if (lowerInput.includes("generate") && lowerInput.includes("axis")) {
        await handleGenerateAxis(message);
      } else if (lowerInput.includes("run") && lowerInput.includes("simulation")) {
        await handleRunSimulation(message);
      } else if (lowerInput.includes("check") && lowerInput.includes("results")) {
        await handleCheckResults();
      } else {
        showBotResponse("I can help you analyze text, generate axes, run simulations, or check results. Try saying something like 'Analyze this text...' or 'Generate an axis about...'");
      }
    } catch (error) {
      console.error("Error processing request:", error);
      showBotResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`w-dvw h-dvh flex flex-col relative font-overused-grotesk justify-center items-center transition-colors duration-300 ease-in-out ${getBgColor()} overflow-hidden`}>
      
      <div className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${startTransition ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div
          className="absolute inset-0 z-0 opacity-30"
          style={{
            backgroundImage: "url('/CanvasBg2.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            pointerEvents: "none",
          }}
        />
        <Gravity
          attractorStrength={0.0}
          cursorStrength={0.00025}
          cursorFieldRadius={100}
          className="w-full h-full z-0 absolute"
        >
          {circles.map((circle, i) => (
            <MatterBody
              key={i}
              matterBodyOptions={{
                friction: 0.2,
                frictionAir: 0.05,
                restitution: 0.2
              }}
              x={`${circle.x}%`}
              y={`${circle.y}%`}
            >
              <div
                className="rounded-full"
                style={{
                  width: `${circle.size}px`,
                  height: `${circle.size}px`,
                  backgroundColor: circle.color,
                  opacity: 0.7,
                }}
              />
            </MatterBody>
          ))}
        </Gravity>
      </div>

      <div className={`flex flex-col items-center justify-center z-10 transition-opacity duration-1000 ease-in-out ${stage >= 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <h1 
          className={`text-3xl text-center leading-none 
                     transition-all duration-300 ease-in-out transform-gpu 
                     ${getTextColor('text-gray-900')} 
                     ${startTransition ? 'scale-50' : 'scale-100'}`}
        >
          <span className={`block z-10 sm:text-sm text-black px-4 font-geist-mono transition-colors duration-300 ease-in-out ${getTextColor('text-black')} animate-[fadeIn_1s_ease-in_forwards]`}>
            WELCOME TO
          </span>
          <span className={`block text-3xl font-normal transition-colors duration-300 ease-in-out ${getTextColor('text-gray-900')} ${showSociety ? 'animate-[fadeIn_1s_ease-in_forwards]' : 'opacity-0'}`}>
            Society
          </span>
        </h1>
      </div>

      <div 
        className={`absolute w-6 h-6 bg-white rounded-full z-5 left-1/2 -translate-x-1/2 top-1/2 transition-opacity duration-1000 ease-in-out
                    ${showExplodingCircle ? 'opacity-100 transform translate-y-8' : 'opacity-0 pointer-events-none transform translate-y-8'}
                    ${stage === 2 ? 'animate-[dropAccelerateThenExplode_0.5s_linear_forwards]' : ''}`}
      />

      <div 
        className={`w-full max-w-md px-4 z-20 
                     transition-all duration-300 ease-in-out transform-gpu 
                     ${startTransition ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
      >
        <TextInput 
          onSubmit={handleSendMessage} 
          className={`${!startTransition ? 'invisible' : ''}`} 
          isLoading={isSubmitting}
        />

        {/* Bot responses */}
        <div className="mt-4 space-y-2">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className="bg-black bg-opacity-80 text-white p-3 rounded-lg max-w-[80%] ml-auto animation-pop-in"
            >
              {message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
