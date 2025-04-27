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

  // ➊ Get viewport width once (or on resize if you like)
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

  return (
    <div className="w-dvw h-dvh flex flex-col relative font-overused-grotesk justify-center items-center bg-white">
      {/* Background image layer */}
      <div
        className="absolute inset-0 z-0 opacity-40"
        style={{
          backgroundImage: "url('/CanvasBg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          pointerEvents: "none", // so it doesn't block interaction
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
          matterBodyOptions={{ friction: 0.5, restitution: 0.2 }}
          x={`${circle.x}%`}
          y={`${circle.y}%`}
        >
          <div
            className="rounded-full"
            style={{
              width: `${circle.size}px`,
              height: `${circle.size}px`,
              backgroundColor: circle.color,
              opacity: 0.9,
            }}
          />
        </MatterBody>
      ))}
      </Gravity>
      <div className="flex flex-col items-center justify-center z-10">
        <h1 className="text-3xl text-gray-900 text-center">
          <span className="block z-10 sm:text-sm md:text-lg text-black px-4 py-2 font-geist-mono opacity-0 animate-[fadeIn_1s_ease-in_forwards]">
            WELCOME TO
          </span>
          <span className="block opacity-0 animate-[fadeIn_1s_ease-in_1s_forwards] text-3xl font-normal mt-2">
            Society
          </span>
        </h1>
      </div>
    </div>
  );
}
