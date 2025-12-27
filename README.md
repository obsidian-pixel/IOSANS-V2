# IOSANS V2 - Sovereign AI Workflow Engine

**IOSANS V2** is a secure, local-first, node-based workflow editor designed for building complex AI agents and automation pipelines without writing code. Built on the "Beast Mode" architecture, it emphasizes sovereignty, modularity, and zero external dependencies for styling or logic.

![IOSANS V2 Editor](https://via.placeholder.com/800x450?text=IOSANS+V2+Workflow+Editor)

## 🌟 Key Features

- **Visual Workflow Editor**: Powered by React Flow, enabling intuitive drag-and-drop construction of logic and AI chains.
- **Inspector-First Architecture**: Clean canvas experience. All configurations (prompts, API keys, logic conditions) are managed in a dedicated Inspector Panel.
- **Sovereign & Secure**:
  - **Local First**: No cloud dependencies required for core logic.
  - **Zero External CSS**: Custom glassmorphism design system built with pure CSS variables.
  - **No "Black Box" Logic**: Full transparency on how nodes execute.
- **Rich Node Library**:
  - **AI Nodes**: Agents (ReAct), LLM (Llama/Mistral), Text-to-Speech, Image Generation.
  - **Logic Nodes**: If/Else, Switch (Dynamic), Merge, Delay.
  - **Action Nodes**: Python Sandbox, JavaScript Executor, HTTP Requests, JSON Transform.
  - **Triggers**: Advanced Scheduler (Cron/Interval).

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/your-repo/iosans-v2.git
    cd iosans-v2
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Start the development server:

    ```bash
    npm run dev
    ```

4.  Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📦 Node Library

### **Trigger Nodes**

- **Schedule**: Run workflows on specific intervals (Minute, Hourly, Daily, Weekly) or custom Cron expressions. Configured via visual calendar in the Inspector.
- **Manual**: Simple button to trigger workflows on demand.

### **AI Nodes**

- **AI Agent**: Autonomous agent capable of calling tools (Search, Calculator, etc.) via a ReAct loop.
- **LLM**: Direct interface to Large Language Models (Llama 3, Phi-3, Gemma).
- **Text to Speech**: Convert text to audio using neural voices.
- **Image Generation**: Generate images from text prompts.

### **Logic Nodes**

- **If/Else**: Conditional branching based on data comparisons (Equals, Contains, >, <).
- **Switch**: Multi-path branching. Add/remove cases dynamically in the Inspector.
- **Delay**: Pause execution for a set duration (ms).
- **Merge**: Combine multiple execution paths into one.

### **Action Nodes**

- **Code Executor**: Run sandboxed JavaScript code.
- **Python**: Execute Python scripts (requires backend runner).
- **HTTP Request**: Make GET/POST/PUT/DELETE requests to external APIs.
- **Transform**: Parse JSON, Stringify data, or Extract specific keys.

## 🛠️ Architecture

IOSANS V2 follows a strict set of architectural rules ("Beast Mode 3.4"):

- **Framework**: React Only.
- **Styling**: No Tailwind/Bootstrap. Pure CSS modules + Global Variables (`NodeInputs.css`, `BaseNode.css`).
- **State Management**: Zustand stores (`workflowStore`, `executionStore`).
- **Configuration**: Decoupled from the visual node. All settings live in `NodeConfigPanel.jsx`.

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch.
3.  Submit a Pull Request.

---

_Verified Sovereign Architecture - 2025_
