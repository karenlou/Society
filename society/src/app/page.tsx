"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Gravity, {
  MatterBody,
} from "@/fancy/components/physics/cursor-attractor-and-gravity"
import { LensInput } from '@/components/Both';
import { TextInput } from '@/components/TextInput';

import {
  CorpusInput,
  AxisInput,
  SimulationResults,
  submitCorpus,
  generateAxis,
  MediaType,
  generateMultimediaAxis,
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
  currentStep: "corpus" | "axis" | "simulation" | "results" | "dataviz";
};

export default function Home() {
  const router = useRouter();
  const [apiState, setApiState] = useState<ApiState>({
    status: "idle",
    currentStep: "corpus"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [isFileUpload, setIsFileUpload] = useState(false);

  const [vw, setVw] = useState<number | null>(null);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [stage, setStage] = useState(0);
  const [showSociety, setShowSociety] = useState(false);
  const [showExplodingCircle, setShowExplodingCircle] = useState(false);
  const [startTransition, setStartTransition] = useState(false);
  const [isFirstInputCondensed, setIsFirstInputCondensed] = useState(false);
  const [isSecondInputVisible, setIsSecondInputVisible] = useState(false);
  const [isSecondInputCondensed, setIsSecondInputCondensed] = useState(false);
  const [isLensLoading, setIsLensLoading] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState('');
  const [submittedLens, setSubmittedLens] = useState('');

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
        width < 640 ? 20 :
          width < 768 ? 30 :
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

  // On component mount, show an initial message
  useEffect(() => {
    if (startTransition) {
      showBotResponse("Welcome to Society AI. Start by entering some text for analysis.");
    }
  }, [startTransition]);

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
        currentStep: "axis"
      }));
      
      showBotResponse(
        `Text processed successfully! Now describe what axis you'd like to analyze it on (e.g., "political leaning", "optimism vs pessimism", etc.)`
      );
    } catch (error) {
      console.error("Error submitting corpus:", error);
      showBotResponse(`Failed to process text: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setApiState(prev => ({ ...prev, status: "error", error: error instanceof Error ? error.message : 'Unknown error' }));
    }
  };

  const handleGenerateAxis = async (axisPrompt: string) => {
    if (!apiState.corpusId) {
      showBotResponse("Please submit a text for analysis first.");
      setApiState(prev => ({ ...prev, currentStep: "corpus" }));
      return;
    }
    
    showBotResponse("Generating axis...");
    setApiState(prev => ({ ...prev, status: "loading" }));
    
    try {
      console.log(`Sending axis request with prompt: "${axisPrompt}"`);
      
      let response;
      
      if (isFileUpload) {
        // For multimedia files, use the dedicated endpoint
        response = await generateMultimediaAxis(apiState.corpusId, axisPrompt);
      } else {
        // For text corpus, use the standard endpoint
        const axisData: AxisInput = {
          corpus_id: apiState.corpusId,
          axis_prompt: axisPrompt,
        };
        
        response = await generateAxis(axisData);
      }
      
      setApiState(prev => ({
        ...prev,
        axisId: response.axis_id,
        status: "success",
        currentStep: "dataviz"
      }));
      
      let responseMessage = `Axis generated! `;
      
      if (response.axis_ends && response.axis_ends.length >= 2) {
        responseMessage += `Spectrum: "${response.axis_ends[0]}" to "${response.axis_ends[1]}"`;
      }
      
      if (response.aggregated_score !== undefined) {
        responseMessage += ` Score: ${response.aggregated_score.toFixed(2)}`;
      }
      
      showBotResponse(responseMessage);
      showBotResponse("Taking you to data visualizations...");
      
      // Add a delay to allow animations to finish before redirecting to dataviz-swarm
      setTimeout(() => {
        // Navigate to the dataviz-swarm page with the corpus_id and axis_id as query parameters
        router.push(`/dataviz-swarm?corpus_id=${apiState.corpusId}&axis_id=${response.axis_id}`);
      }, 2000);
    } catch (error) {
      console.error("Error generating axis:", error);
      showBotResponse(`Failed to generate axis: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setApiState(prev => ({ ...prev, status: "error", error: error instanceof Error ? error.message : 'Unknown error' }));
    }
  };


  // Handler for file uploads
  const handleFileUpload = (file: File, mediaType: MediaType) => {
    console.log("File uploaded:", file.name, "Type:", mediaType);
    setIsFileUpload(true);
    showBotResponse(`File "${file.name}" uploaded. Processing as ${mediaType}...`);
    
    // Here you could add logic to handle the file upload using submitMultimedia
    // This is just a placeholder that sets the flag
  };

  // Handler for the TextInput submission
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    console.log("Message submitted:", message);
    setSubmittedMessage(message);
    
    // Use a smoother animation sequence with precise timing
    setTimeout(() => {
      setIsSubmitting(false);
      
      // Add a small delay before starting the condensing animation
      setTimeout(() => {
        setIsFirstInputCondensed(true);
        
        // Stagger the second input appearance for a more natural flow
        // Wait until the first input is mostly condensed
        setTimeout(() => {
          setIsSecondInputVisible(true);
          
          // Process the text through the API
          handleSubmitCorpus(message);
        }, 250); // Slightly shorter delay for a more connected feel
      }, 50); // Very slight delay for visual separation
    }, 2000);
  };

  // Handler for the LensInput submission
  const handleSendLens = (lens: string) => {
    console.log("Lens submitted:", lens);
    setSubmittedLens(lens);
    
    // Set loading only for lens submission
    setIsLensLoading(true);
    
    setTimeout(() => {
      setIsLensLoading(false);
      setIsSecondInputCondensed(true);
      
      // Process the lens through the API
      if (apiState.corpusId) {
        handleGenerateAxis(lens);
      }
    }, 2000);
  };

  // Add this function to handle the Edit button click
  const handleEditMessage = () => {
    // Uncondense the first input
    setIsFirstInputCondensed(false);
    
    // Completely reset the second input
    setSubmittedLens('');
    setIsSecondInputCondensed(false);
    setIsSecondInputVisible(false);
    
    // The default placeholder text is automatically shown when the component
    // reappears because we're setting submittedLens to an empty string
    // and the LensInput component has the placeholder text built in
  };

  // Add this function to handle when the message is edited and resubmitted
  const handleMessageEditSubmit = () => {
    // This function is no longer needed since we're now handling the reset
    // in the handleEditMessage function above
    console.log("Message edited and resubmitted");
  };

  // Handler for editing the lens
  const handleEditLens = () => {
    setIsSecondInputCondensed(false);
  };

  return (
    <div className={`w-dvw h-dvh flex flex-col relative font-overused-grotesk justify-center items-center transition-colors duration-300 ease-in-out ${getBgColor()} overflow-hidden`}>
      
      {/* Background elements that should always be present */}
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
          cursorStrength={0.0004}
          cursorFieldRadius={200}
          className="w-full h-full z-0 absolute"
        >
          {circles.map((circle, i) => (
            <MatterBody
              key={i}
              matterBodyOptions={{
                friction: 0.5,
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
      
      {/* Main content with conditional opacity */}
      <div className={`flex flex-col items-center justify-center w-full h-full`}>
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

        <div className="w-full max-w-md px-4 z-20 relative">
          {/* First TextInput */}
          <div 
            className={`
              transform-gpu transition-opacity duration-400 ease-out
              ${startTransition ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}
            `}
          >
            <TextInput 
              onSubmit={handleSendMessage}
              onEditSubmit={handleMessageEditSubmit}
              isLoading={isSubmitting}
              isCondensed={isFirstInputCondensed}
              onEdit={handleEditMessage}
              initialValue={submittedMessage}
              onFileUpload={handleFileUpload}
              className={`${!startTransition ? 'invisible' : ''}`} 
            />
          </div>
          
          {/* Second input (LensInput) */}
          <div 
            className={`
              mt-5 transform-gpu transition-all duration-500 ease-out
              ${isSecondInputVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-10 pointer-events-none'}
            `}
          >
            <LensInput 
              onSubmit={handleSendLens}
              isLoading={isLensLoading}
              isCondensed={isSecondInputCondensed}
              onEdit={handleEditLens}
              initialValue={submittedLens}
            />
          </div>
        </div>
      </div>
    </div>
  );
}