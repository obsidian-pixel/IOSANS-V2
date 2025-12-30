export const TEMPLATES = [
  {
    id: "story-narrator",
    name: "Story Narrator",
    icon: "📖",
    description: "Generates a story from a prompt and narrates it via audio.",
    nodes: [
      {
        id: "trigger-1",
        type: "manualTrigger",
        position: { x: 50, y: 150 },
        data: { label: "Start" },
      },
      {
        id: "model-1",
        type: "llm",
        position: { x: 600, y: -50 }, // Position above Agent
        data: {
          label: "Llama-3 Model",
          modelId: "Llama-3-8B-Instruct-q4f32_1", // Default to a standard model
          temperature: 0.7,
        },
      },
      {
        id: "prompt-1",
        type: "codeExecutor",
        position: { x: 300, y: 150 },
        data: {
          label: "Define Topic",
          code: `// Return the topic for the story\nreturn { prompt: "Write a short, engaging story about a brave toaster who saves breakfast." };`,
        },
      },
      {
        id: "agent-1",
        type: "aiAgent",
        position: { x: 600, y: 150 },
        data: {
          label: "Story Writer",
          systemPrompt:
            "You are a creative storyteller. Write a very short story (max 100 words) based on the user topic.",
          // Model is now connected via handle
        },
      },
      {
        id: "tts-1",
        type: "textToSpeech",
        position: { x: 900, y: 150 }, // Moving to right for better flow
        data: {
          label: "Narrator",
          voice: "en-US-Neural2-F",
        },
      },
      {
        id: "out-1",
        type: "output",
        position: { x: 1200, y: 150 },
        data: { label: "Audio Player" },
      },
    ],
    edges: [
      {
        id: "e1",
        source: "trigger-1",
        target: "prompt-1",
        sourceHandle: "source",
        targetHandle: "target",
        type: "animated",
        animated: true,
      },
      {
        id: "e-model",
        source: "model-1",
        target: "agent-1",
        sourceHandle: "source", // LLM output
        targetHandle: "model", // Agent Top Handle
        type: "default",
      },
      {
        id: "e2",
        source: "prompt-1",
        target: "agent-1",
        sourceHandle: "source",
        targetHandle: "target",
        type: "animated",
        animated: true,
      },
      {
        id: "e3",
        source: "agent-1",
        target: "tts-1",
        sourceHandle: "source",
        targetHandle: "target",
        type: "animated",
        animated: true,
      },
      {
        id: "e4",
        source: "tts-1",
        target: "out-1",
        sourceHandle: "source",
        targetHandle: "target",
        type: "animated",
        animated: true,
      },
    ],
  },
];
