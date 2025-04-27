import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  let requestBody;
  
  try {
    requestBody = await request.json();
    const message = requestBody.message;
    
    try {
      // Try connecting to ngrok backend
      const response = await fetch("https://db30-164-67-70-232.ngrok-free.app", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      
      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch (backendError) {
      console.error('Error connecting to backend:', backendError);
    }
    
    // Fallback to echo mode if backend fails
    return NextResponse.json({ 
      response: `Echo: "${message}"` 
    });
    
  } catch (error) {
    console.error('Error processing chat request:', error);
    return NextResponse.json(
      { response: "I couldn't understand that message" },
      { status: 400 }
    );
  }
} 