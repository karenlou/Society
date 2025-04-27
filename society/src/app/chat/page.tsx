"use client"

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

type MessageType = "user" | "bot";

interface Message {
  id: string;
  type: MessageType;
  content: string;
}

type ApiState = {
  corpusId?: string;
  axisId?: string;
  simulationId?: string;
  status: "idle" | "loading" | "success" | "error";
  result?: SimulationResults;
  error?: string;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content:
        "Hello! I can help you analyze text, generate axes for analysis, run simulations, and check results. What would you like to do?",
    },
  ]);
  
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiState, setApiState] = useState<ApiState>({
    status: "idle",
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addMessage = (type: MessageType, content: string) => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const addBotResponse = (content: string) => {
    addMessage("bot", content);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting) return;

    setIsSubmitting(true);
    addMessage("user", input);
    
    try {
      // Handle different intents
      const lowerInput = input.toLowerCase();
      
      if (lowerInput.includes("analyze") || lowerInput.includes("text") || lowerInput.includes("corpus")) {
        await handleSubmitCorpus(input);
      } else if (lowerInput.includes("generate") && lowerInput.includes("axis")) {
        await handleGenerateAxis(input);
      } else if (lowerInput.includes("run") && lowerInput.includes("simulation")) {
        await handleRunSimulation(input);
      } else if (lowerInput.includes("check") && lowerInput.includes("results")) {
        await handleCheckResults();
      } else {
        addBotResponse("I'm not sure what you want to do. You can ask me to analyze text, generate an axis, run a simulation, or check results.");
      }
    } catch (error) {
      console.error("Error processing request:", error);
      addBotResponse(`There was an error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setApiState(prev => ({ ...prev, status: "error", error: error instanceof Error ? error.message : 'Unknown error' }));
    } finally {
      setInput("");
      setIsSubmitting(false);
    }
  };

  const handleSubmitCorpus = async (text: string) => {
    addBotResponse("Processing your text...");
    setApiState(prev => ({ ...prev, status: "loading" }));
    
    try {
      // Just check there's minimal content
      if (text.length < 2) {
        addBotResponse("Please provide some text content for analysis.");
        setApiState(prev => ({ ...prev, status: "idle" }));
        return;
      }
      
      // Simply pass the text to the backend
      const corpusData: CorpusInput = {
        corpus: text,
        title: "User Submitted Text",
      };
      
      // Send to backend API
      const response = await submitCorpus(corpusData);
      
      // Store the corpus ID we received
      setApiState(prev => ({
        ...prev,
        corpusId: response.corpus_id,
        status: "success",
      }));
      
      // Simply display the response information
      addBotResponse(
        `Text processed successfully!\n\nCorpus ID: ${response.corpus_id}\n\nYou can now generate an axis for this text by saying "Generate an axis about [topic]".`
      );
    } catch (error) {
      console.error("Error submitting corpus:", error);
      addBotResponse(`Failed to process text: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setApiState(prev => ({ ...prev, status: "error", error: error instanceof Error ? error.message : 'Unknown error' }));
    }
  };

  const handleGenerateAxis = async (text: string) => {
    if (!apiState.corpusId) {
      addBotResponse("Please submit a text for analysis first.");
      return;
    }
    
    addBotResponse("Generating axis...");
    setApiState(prev => ({ ...prev, status: "loading" }));
    
    try {
      // Extract the axis prompt from the message
      const promptRegex = /generate an axis (about|for|on) (.+)/i;
      const match = text.match(promptRegex);
      const axisPrompt = match ? match[2].trim() : "general sentiment";
      
      // Simply log what we're sending
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
      
      // Handle the actual API response format
      let responseMessage = `Axis generated successfully!\n\nAxis ID: ${response.axis_id}`;
      
      // Use axis_ends instead of scale
      if (response.axis_ends && response.axis_ends.length >= 2) {
        responseMessage += `\n\nAxis spectrum: From "${response.axis_ends[0]}" to "${response.axis_ends[1]}"`;
      }
      
      if (response.aggregated_score !== undefined) {
        responseMessage += `\n\nAggregated score: ${response.aggregated_score.toFixed(2)}`;
      }
      
      responseMessage += `\n\nYou can now run a simulation by saying "Run a simulation with [number] agents".`;
      
      addBotResponse(responseMessage);
    } catch (error) {
      console.error("Error generating axis:", error);
      addBotResponse(`Failed to generate axis: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setApiState(prev => ({ ...prev, status: "error", error: error instanceof Error ? error.message : 'Unknown error' }));
    }
  };

  const handleRunSimulation = async (text: string) => {
    if (!apiState.corpusId || !apiState.axisId) {
      addBotResponse("Please submit a text and generate an axis first.");
      return;
    }
    
    addBotResponse("Preparing to run simulation...");
    setApiState(prev => ({ ...prev, status: "loading" }));
    
    try {
      // Extract agent count from message
      const agentCountRegex = /run a simulation with (\d+) agents/i;
      const match = text.match(agentCountRegex);
      const agentCount = match ? parseInt(match[1]) : 50; // Default to 50 if not specified
      
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
        status: "loading", // Keep in loading state while polling
      }));
      
      addBotResponse(
        `Simulation started!\n\nSimulation ID: ${response.simulation_id}\n\nNow polling for results. This may take a few minutes...`
      );
      
      // Start polling for results
      pollForResults(response.simulation_id);
    } catch (error) {
      console.error("Error running simulation:", error);
      addBotResponse(`Failed to run simulation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setApiState(prev => ({ ...prev, status: "error", error: error instanceof Error ? error.message : 'Unknown error' }));
    }
  };

  const handleCheckResults = async () => {
    if (!apiState.simulationId) {
      addBotResponse("No simulation has been run yet. Please run a simulation first.");
      return;
    }
    
    addBotResponse("Checking simulation results...");
    setApiState(prev => ({ ...prev, status: "loading" }));
    
    try {
      const results = await getSimulationResults(apiState.simulationId);
      
      if (results.status === "processing") {
        setApiState(prev => ({
          ...prev,
          status: "loading",
        }));
        
        addBotResponse(
          `Simulation is still processing. Current progress: ${results.percent_complete || 0}%`
        );
        
        // Continue polling
        pollForResults(apiState.simulationId);
      } else if (results.status === "completed") {
        setApiState(prev => ({
          ...prev,
          status: "success",
          result: results,
        }));
        
        formatAndDisplayResults(results);
      } else {
        addBotResponse(`Simulation encountered an error.`);
        setApiState(prev => ({ ...prev, status: "error", error: "Simulation failed" }));
      }
    } catch (error) {
      console.error("Error checking results:", error);
      addBotResponse(`Failed to check results: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setApiState(prev => ({ ...prev, status: "error", error: error instanceof Error ? error.message : 'Unknown error' }));
    }
  };

  const pollForResults = (simulationId: string) => {
    pollSimulationResults(
      simulationId,
      (progress) => {
        // Update UI with progress
        if (progress.status === "processing") {
          addBotResponse(`Simulation in progress... ${progress.percent_complete || 0}% complete`);
        }
      }
    )
      .then(() => {
        // Simulation completed, get the final results
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
            addBotResponse(`Failed to get final results: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setApiState(prev => ({ ...prev, status: "error", error: error instanceof Error ? error.message : 'Unknown error' }));
          });
      })
      .catch((error) => {
        console.error("Error polling for results:", error);
        addBotResponse(`Failed to poll for results: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setApiState(prev => ({ ...prev, status: "error", error: error instanceof Error ? error.message : 'Unknown error' }));
      });
  };

  const formatAndDisplayResults = (results: SimulationResults) => {
    const { global_results, demographic_breakdowns, key_reactions } = results;
    
    let message = `## Simulation Results\n\n`;
    
    // Global results with null checks
    if (global_results) {
      message += `### Overall Score: ${global_results.overall_score.toFixed(2)}\n`;
      message += `Confidence: ${global_results.confidence.toFixed(2)}\n\n`;
      message += `**Interpretation**: ${global_results.interpretation}\n\n`;
    } else {
      message += `### Results received but no global results data available.\n\n`;
    }
    
    // Key reactions
    if (key_reactions && key_reactions.length > 0) {
      message += `### Key Reactions:\n`;
      key_reactions.forEach((reaction, index) => {
        message += `${index + 1}. ${reaction}\n`;
      });
      message += `\n`;
    }
    
    // Demographic breakdowns
    if (demographic_breakdowns) {
      message += `### Demographic Breakdowns:\n\n`;
      
      if (demographic_breakdowns.by_age) {
        message += `#### By Age:\n`;
        Object.entries(demographic_breakdowns.by_age).forEach(([age, score]) => {
          message += `- ${age}: ${score.toFixed(2)}\n`;
        });
        message += `\n`;
      }
      
      if (demographic_breakdowns.by_political_leaning) {
        message += `#### By Political Leaning:\n`;
        Object.entries(demographic_breakdowns.by_political_leaning).forEach(([leaning, score]) => {
          message += `- ${leaning}: ${score.toFixed(2)}\n`;
        });
        message += `\n`;
      }
      
      if (demographic_breakdowns.by_gender) {
        message += `#### By Gender:\n`;
        Object.entries(demographic_breakdowns.by_gender).forEach(([gender, score]) => {
          message += `- ${gender}: ${score.toFixed(2)}\n`;
        });
      }
    }
    
    addBotResponse(message);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      {/* Header with status */}
      <div className="flex justify-between items-center mb-4 p-2 border-b">
        <h1 className="text-xl font-bold">Society AI Chat</h1>
        <div className="flex items-center gap-2">
          <div className="text-sm">
            {apiState.status === "loading" && "Loading..."}
            {apiState.status === "success" && "Ready"}
            {apiState.status === "error" && "Error"}
          </div>
          <div 
            className={cn(
              "w-3 h-3 rounded-full",
              {
                "bg-yellow-500": apiState.status === "loading",
                "bg-green-500": apiState.status === "success",
                "bg-red-500": apiState.status === "error",
                "bg-gray-300": apiState.status === "idle",
              }
            )}
          />
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message) => (
          <Card 
            key={message.id}
            className={cn(
              "p-4 max-w-[80%]",
              message.type === "user" ? "ml-auto bg-blue-100" : "mr-auto bg-gray-100"
            )}
          >
            <div className="whitespace-pre-line">{message.content}</div>
          </Card>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded"
          disabled={isSubmitting}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send"}
        </Button>
      </form>
    </div>
  );
} 