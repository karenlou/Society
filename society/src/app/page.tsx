"use client"

import Image from "next/image";
import { useEffect, useState } from "react";

import Gravity, {
  MatterBody,
} from "@/fancy/components/physics/cursor-attractor-and-gravity"

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
    const timer1 = setTimeout(() => {
      setStage(1);
    }, 1000);

    const timer2 = setTimeout(() => {
      setStage(2);
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const getBgColor = () => {
    if (stage < 2) return 'bg-black';
    return 'bg-white';
  };

  const getTextColor = (finalColor: string) => {
    if (stage < 2) return 'text-stone-200';
    return finalColor;
  };

  return (
    <div className={`w-dvw h-dvh flex flex-col relative font-overused-grotesk justify-center items-center transition-colors duration-1000 ease-in-out ${getBgColor()}`}>
      
      <div className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${stage === 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
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
        <h1 className={`text-3xl text-center leading-none transition-colors duration-1000 ease-in-out ${getTextColor('text-gray-900')}`}>
          <span className={`block z-10 sm:text-sm text-black px-4 font-geist-mono transition-colors duration-1000 ease-in-out ${getTextColor('text-black')} animate-[fadeIn_1s_ease-in_forwards]`}>
            WELCOME TO
          </span>
          <span className={`block text-3xl font-normal transition-colors duration-1000 ease-in-out ${getTextColor('text-gray-900')} animate-[fadeIn_1s_ease-in_1s_forwards]`}>
            Society
          </span>
        </h1>
      </div>
    </div>
  );
}
