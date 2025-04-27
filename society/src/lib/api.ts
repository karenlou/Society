// API Base URL - Change this when your ngrok URL changes
export const API_CONFIG = {
  baseUrl: "https://lahacks-production.up.railway.app",
  apiPath: "/api"
};

// Full API URL constructed from the config
export const API_BASE_URL = `${API_CONFIG.baseUrl}${API_CONFIG.apiPath}`;

// Type definitions based on the backend API
export type CorpusInput = {
  corpus: string;
  title: string;
};

export type CorpusResponse = {
  corpus_id: string;
  title: string;
  chunks?: Array<{
    chunk_id: string;
    text: string;
  }>;
};

export type AxisInput = {
  corpus_id: string;
  axis_prompt: string;
};

export type AxisResponse = {
  axis_id: string;
  corpus_id: string;
  description: string;
  scale: {
    min: number;
    max: number;
    min_label: string;
    max_label: string;
    neutral_label?: string;
  };
};

export type SimulationInput = {
  corpus_id: string;
  axis_id: string;
  agent_count: number;
  demographics: {
    age_groups: string[];
    political_leanings: string[];
  };
};

export type SimulationResponse = {
  simulation_id: string;
  estimated_completion_time?: string;
  status: "processing";
};

export type SimulationResults = {
  simulation_id: string;
  corpus_id: string;
  axis_id: string;
  status: "completed" | "processing" | "error";
  percent_complete?: number;
  global_results?: {
    overall_score: number;
    confidence: number;
    interpretation: string;
    key_factors?: string[];
  };
  score_distribution?: Array<number>;
  key_reactions?: Array<string>;
  demographic_breakdowns?: {
    by_age?: Record<string, number>;
    by_political_leaning?: Record<string, number>;
    by_gender?: Record<string, number>;
  };
};

export type AgentDetails = {
  agent_id: string;
  simulation_id: string;
  demographics: {
    age: string;
    gender?: string;
    political_leaning: string;
  };
  score: number;
  reasoning: string;
};

/**
 * Submit a corpus (text) for analysis
 * Simply forwards the text to the backend without any processing
 */
export async function submitCorpus(input: CorpusInput): Promise<CorpusResponse> {
  console.log("Submitting corpus with data:", JSON.stringify(input, null, 2));
  
  try {
    const response = await fetch(`${API_BASE_URL}/corpus`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      // Try to get error details from response
      let errorDetails = "";
      try {
        const errorData = await response.json();
        errorDetails = JSON.stringify(errorData);
      } catch {
        errorDetails = "Could not parse error response";
      }
      
      console.error(`HTTP error! status: ${response.status}, details:`, errorDetails);
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorDetails}`);
    }

    const data = await response.json();
    console.log("Corpus API response:", JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error("Error in submitCorpus:", error);
    throw error;
  }
}

/**
 * Generate an axis for analysis
 * Simply forwards the corpus_id and axis_prompt to the backend
 */
export async function generateAxis(input: AxisInput): Promise<AxisResponse> {
  console.log("Generating axis with data:", JSON.stringify(input, null, 2));
  
  try {
    const response = await fetch(`${API_BASE_URL}/axis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      // Try to get error details from response
      let errorDetails = "";
      try {
        const errorData = await response.json();
        errorDetails = JSON.stringify(errorData);
      } catch {
        errorDetails = "Could not parse error response";
      }
      
      console.error(`HTTP error! status: ${response.status}, details:`, errorDetails);
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorDetails}`);
    }

    const data = await response.json();
    console.log("Axis API response:", JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error("Error in generateAxis:", error);
    throw error;
  }
}

/**
 * Execute a simulation
 * Simply forwards the parameters to the backend
 */
export async function runSimulation(input: SimulationInput): Promise<SimulationResponse> {
  console.log("Running simulation with data:", JSON.stringify(input, null, 2));
  
  try {
    const response = await fetch(`${API_BASE_URL}/simulate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      // Try to get error details from response
      let errorDetails = "";
      try {
        const errorData = await response.json();
        errorDetails = JSON.stringify(errorData);
      } catch {
        errorDetails = "Could not parse error response";
      }
      
      console.error(`HTTP error! status: ${response.status}, details:`, errorDetails);
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorDetails}`);
    }

    const data = await response.json();
    console.log("Simulation API response:", JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error("Error in runSimulation:", error);
    throw error;
  }
}

/**
 * Get simulation results
 * Simply forwards the request to the backend
 */
export async function getSimulationResults(simulationId: string): Promise<SimulationResults> {
  const response = await fetch(`${API_BASE_URL}/results/${simulationId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Get agent details from a simulation
 * Simply forwards the request to the backend
 */
export async function getAgentDetails(simulationId: string): Promise<AgentDetails[]> {
  const response = await fetch(`${API_BASE_URL}/agents/${simulationId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Simple polling function to check simulation status
 * This just repeatedly calls the getSimulationResults endpoint
 */
export async function pollSimulationResults(
  simulationId: string,
  progressCallback?: (progress: {status: string; percent_complete?: number}) => void,
  maxAttempts: number = 60,
  interval: number = 2000
): Promise<void> {
  let attempts = 0;
  
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        if (attempts >= maxAttempts) {
          reject(new Error("Polling timed out"));
          return;
        }
        
        attempts++;
        const result = await getSimulationResults(simulationId);
        
        // Call progress callback if provided
        if (progressCallback) {
          progressCallback({
            status: result.status,
            percent_complete: result.percent_complete
          });
        }
        
        // Check if simulation is complete
        if (result.status === "completed") {
          resolve();
          return;
        } else if (result.status === "error") {
          reject(new Error("Simulation failed"));
          return;
        }
        
        // Continue polling
        setTimeout(poll, interval);
      } catch (error) {
        reject(error);
      }
    };
    
    // Start polling
    poll();
  });
} 