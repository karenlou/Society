# Frontend Chat Interface Documentation

## Overview
This document outlines the data structures and API endpoints for the chat interface of our Persona-Based AI Simulation platform.

## API Endpoints

### 1. Corpus Submission
**Endpoint:** `/api/corpus`  
**Method:** POST

**Request:**
```json
{
  "corpus": "Full text content here",
  "title": "Optional title for the corpus"
}
```

**Response:**
```json
{
  "corpus_id": "unique-id-123",
  "chunks": [
    {"id": "chunk-1", "text": "First meaningful section..."},
    {"id": "chunk-2", "text": "Second meaningful section..."}
  ],
  "total_chunks": 12,
  "status": "processed"
}
```

### 2. Axis Generation
**Endpoint:** `/api/axis`  
**Method:** POST

**Request:**
```json
{
  "corpus_id": "unique-id-123",
  "insight_prompt": "Who won the debate?"
}
```

**Response:**
```json
{
  "axis_id": "axis-456",
  "description": "Trump Victory ←→ Kamala Victory",
  "scale": {
    "min": -10,
    "max": 10,
    "min_label": "Strong Trump Victory",
    "max_label": "Strong Kamala Victory",
    "neutral_label": "Tie"
  }
}
```

### 3. Simulation Execution
**Endpoint:** `/api/simulate`  
**Method:** POST

**Request:**
```json
{
  "corpus_id": "unique-id-123",
  "axis_id": "axis-456",
  "agent_count": 10000,
  "demographics": {
    "age_groups": ["18-24", "25-34", "35-49", "50-64", "65+"],
    "income_levels": ["low", "middle", "high"],
    "education_levels": ["high_school", "college", "graduate"],
    "political_leanings": ["liberal", "moderate", "conservative"],
    "geographic_regions": ["northeast", "midwest", "south", "west"]
  }
}
```

**Response:**
```json
{
  "simulation_id": "sim-789",
  "status": "processing",
  "estimated_completion_time": "30 seconds"
}
```

### 4. Simulation Results
**Endpoint:** `/api/results/{simulation_id}`  
**Method:** GET

**Response:**
```json
{
  "simulation_id": "sim-789",
  "status": "completed",
  "global_results": {
    "overall_score": 2.7,
    "interpretation": "Slight Kamala Victory",
    "confidence": 0.72
  },
  "chunk_progression": [
    {
      "chunk_id": "chunk-1",
      "average_score": -1.2,
      "score_distribution": [/* distribution data */],
      "key_reactions": [/* notable agent reactions */]
    },
    /* Additional chunks */
  ],
  "demographic_breakdowns": {
    "by_age": {
      "18-24": 3.8,
      "25-34": 3.2,
      /* other age groups */
    },
    "by_political_leaning": {
      "liberal": 7.2,
      "moderate": 2.1,
      "conservative": -4.5
    },
    /* other demographic breakdowns */
  }
}
```

### 5. Get Agent Details
**Endpoint:** `/api/agents/{simulation_id}`  
**Method:** GET

**Response:**
```json
{
  "agents": [
    {
      "id": "agent-001",
      "persona": {
        "age": 42,
        "gender": "female",
        "race": "hispanic",
        "income": "middle",
        "education": "college",
        "political_leaning": "moderate",
        "region": "southwest"
      },
      "final_score": 1.8,
      "progression": [
        {"chunk_id": "chunk-1", "score": -2.1, "reaction": "Skeptical about economic claims"},
        {"chunk_id": "chunk-2", "score": 0.5, "reaction": "More positive due to healthcare discussion"},
        /* Additional chunk reactions */
      ]
    },
    /* Additional agents */
  ]
}
```

## Data Models

### Corpus
```
Corpus {
  id: string
  title: string
  text: string
  chunks: Chunk[]
  created_at: datetime
}

Chunk {
  id: string
  corpus_id: string
  text: string
  sequence: number
}
```

### Axis
```
Axis {
  id: string
  corpus_id: string
  prompt: string
  description: string
  min_label: string
  max_label: string
  neutral_label: string
  created_at: datetime
}
```

### Simulation
```
Simulation {
  id: string
  corpus_id: string
  axis_id: string
  agent_count: number
  status: "processing" | "completed" | "failed"
  created_at: datetime
  completed_at: datetime
}
```

### Agent
```
Agent {
  id: string
  simulation_id: string
  persona: {
    age: number
    gender: string
    race: string
    income: string
    education: string
    political_leaning: string
    region: string
  }
  reactions: Reaction[]
}

Reaction {
  chunk_id: string
  score: number (-10 to 10)
  reaction_text: string
  emotion: string
}
```

## WebSocket Events (Future Implementation)
For real-time updates during simulation processing:

```
// Connection
ws://your-domain.com/ws/simulation/{simulation_id}

// Events
{
  "event": "processing_update",
  "data": {
    "percent_complete": 45,
    "agents_processed": 4500,
    "estimated_time_remaining": "15 seconds"
  }
}

{
  "event": "chunk_completed",
  "data": {
    "chunk_id": "chunk-3",
    "preview_score": 1.8,
    "trending_direction": "up"
  }
}

{
  "event": "simulation_completed",
  "data": {
    "simulation_id": "sim-789",
    "results_endpoint": "/api/results/sim-789"
  }
}
```

> **Note on WebSockets:** The WebSocket functionality is suggested for future implementation. It would be particularly valuable for providing real-time updates during simulation processing, which could take significant time for large agent counts. Without WebSockets, the frontend would need to poll the server regularly to check simulation status. 