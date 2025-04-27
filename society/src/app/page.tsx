"use client"

import Image from "next/image";
import { useEffect, useState } from "react";

import Gravity, {
  MatterBody,
} from "@/fancy/components/physics/cursor-attractor-and-gravity"
import { TextInput } from '@/components/TextInput';

type Circle = {
  size: number;
  color: string;
  x: number;
  y: number;
};

export default function Home() {
  const words = [
    "we",
    "analyze",
    { text: "millions", highlight: true },
    { text: "of", highlight: true },
    { text: "data", highlight: true },
    { text: "points", highlight: true },
    "per",
    "second",
    "to",
    "provide",
    "you",
    "with",
    "the",
    "most",
    "accurate",
    "insights.",
  ]

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

  // Handler for the TextInput submission
  const handleSendMessage = (message: string) => {
    console.log("Message submitted:", message);
    // TODO: Add logic to actually send/process the message
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
        <h1 className={`text-3xl text-center leading-none transition-colors duration-300 ease-in-out ${getTextColor('text-gray-900')}`}>
          <span className={`block z-10 sm:text-sm text-black px-4 font-geist-mono transition-colors duration-300 ease-in-out ${getTextColor('text-black')} animate-[fadeIn_1s_ease-in_forwards]`}>
            WELCOME TO
          </span>
          <span className={`block text-3xl font-normal transition-colors duration-300 ease-in-out ${getTextColor('text-gray-900')} ${showSociety ? 'animate-[fadeIn_1s_ease-in_forwards]' : 'opacity-0'}`}>
            Society
          </span>
        </h1>

        <div className={`w-full max-w-2xl px-4 mt-5 transition-opacity duration-300 ease-in-out ${startTransition ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <TextInput 
            onSubmit={handleSendMessage} 
            className={`${!startTransition ? 'invisible' : ''}`}
          />
        </div>

      </div>

      <div 
        className={`absolute w-6 h-6 bg-white rounded-full z-5 left-1/2 -translate-x-1/2 top-1/2 transition-opacity duration-1000 ease-in-out
                    ${showExplodingCircle ? 'opacity-100 transform translate-y-8' : 'opacity-0 pointer-events-none transform translate-y-8'}
                    ${stage === 2 ? 'animate-[dropAccelerateThenExplode_0.5s_linear_forwards]' : ''}`}
      />
    </div>
  );
}
