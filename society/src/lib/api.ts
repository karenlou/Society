import { createClient } from '@supabase/supabase-js';

// API Base URL - Change this when your ngrok URL changes
export const API_CONFIG = {
  baseUrl: "https://lahacks-production.up.railway.app",
  apiPath: "/api"
};

// Full API URL constructed from the config
export const API_BASE_URL = `${API_CONFIG.baseUrl}${API_CONFIG.apiPath}`;

// Supabase configuration - Replace these values with your own
export const SUPABASE_CONFIG = {
  url: "https://rlbejriorwnzlbnhfbkg.supabase.co",
  key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsYmVqcmlvcnduemxibmhmYmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2OTUwNTIsImV4cCI6MjA2MTI3MTA1Mn0.-89nVz1RMJQ5-AOdXdw-qc_xmYs4dKzQKv1fu0B0P04",
  bucket: "society-media"
};

// Initialize Supabase client
const supabase = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.key
);

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
  axis_ends: string[];
  chunk_count: number;
  chunk_scores: Array<{
    chunk_index: number;
    avg_score: number;
  }>;
  agent_chunk_scores?: Array<{
    chunk_index: number;
    agent_scores: Array<{
      agent_id: string;
      score: number;
      metadata?: Record<string, string | number | boolean>;
    }>;
    distribution_stats?: Record<string, number>;
  }>;
  aggregated_score: number;
};

// Multimedia types
export enum MediaType {
  VIDEO = "video",
  AUDIO = "audio",
  IMAGE = "image"
}

export type TimeSegment = {
  start_time: number;
  end_time: number;
}

export type MultimediaChunk = {
  id: string;
  text: string;
  media_type: MediaType;
  metadata: Record<string, unknown>;
  time_segment?: TimeSegment;
}

export type MultimediaSubmissionInput = {
  file_url: string;
  media_type: MediaType;
  metadata: Record<string, unknown>;
  chunk_size_seconds?: number;
  chunk_overlap_seconds?: number;
}

export type MultimediaResponse = {
  corpus_id: string;
  media_type: MediaType;
  chunk_count: number;
  duration_seconds?: number;
  first_chunk_preview?: string;
}

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
 * Submit multimedia content (video, audio, image) for analysis
 * This first uploads to Supabase storage and then sends the URL to the backend
 */
export async function submitMultimedia(
  file: File, 
  mediaType: MediaType, 
  options: {
    chunkSizeSeconds?: number,
    chunkOverlapSeconds?: number,
    metadata?: Record<string, unknown>
  } = {}
): Promise<MultimediaResponse> {
  console.log(`Submitting multimedia: ${mediaType} file`, file.name);
  
  try {
    // First upload to Supabase storage
    const fileUrl = await uploadToStorage(file);
    console.log("File uploaded to storage:", fileUrl);
    
    // Prepare multimedia JSON payload with file URL
    const input = {
      file_url: fileUrl,
      media_type: mediaType,
      metadata: options.metadata || { filename: file.name },
      chunk_size_seconds: options.chunkSizeSeconds || 15.0,
      chunk_overlap_seconds: options.chunkOverlapSeconds || 5.0
    };
    
    // Send the file URL to the backend multimedia endpoint
    const response = await fetch(`${API_BASE_URL}/multimedia`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    console.log("Multimedia API response:", JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error("Error in submitMultimedia:", error);
    throw error;
  }
}

/**
 * Upload a file to Supabase storage and return the URL
 */
async function uploadToStorage(file: File): Promise<string> {
  console.log(`Uploading ${file.name} to Supabase storage...`);
  
  // Create a unique filename
  const timestamp = new Date().getTime();
  const uniqueFileName = `${timestamp}-${file.name.replace(/\s+/g, '-')}`;
  const filePath = `uploads/${uniqueFileName}`;
  
  try {
    // Upload the file to Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from(SUPABASE_CONFIG.bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error("Error uploading to Supabase:", uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }
    
    // Get the public URL for the uploaded file
    const { data } = supabase
      .storage
      .from(SUPABASE_CONFIG.bucket)
      .getPublicUrl(filePath);
    
    if (!data || !data.publicUrl) {
      throw new Error("Failed to get public URL from Supabase");
    }
    
    console.log("File successfully uploaded to Supabase, URL:", data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error("Error in Supabase storage upload:", error);
    
    // Fallback to a mock URL if in development mode
    if (process.env.NODE_ENV === 'development') {
      console.warn("Using mock URL due to Supabase error in dev mode");
      return `https://example-storage.supabase.co/storage/v1/object/public/${SUPABASE_CONFIG.bucket}/${filePath}`;
    }
    
    throw error;
  }
}

/**
 * Generate an axis for a multimedia corpus
 * Sends the request directly to the backend multimedia axis endpoint
 */
export async function generateMultimediaAxis(corpusId: string, axisPrompt: string): Promise<AxisResponse> {
  console.log(`Generating axis for multimedia corpus: ${corpusId}`);
  
  try {
    const input = {
      axis_prompt: axisPrompt
    };
    
    const response = await fetch(`${API_BASE_URL}/multimedia/${corpusId}/axis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
    console.log("Multimedia axis API response:", JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error("Error in generateMultimediaAxis:", error);
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