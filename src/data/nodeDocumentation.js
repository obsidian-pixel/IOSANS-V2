/**
 * Node Documentation Data
 * Source of truth for the DocsModal.
 * STRICTLY ALIGNED WITH: src/nodes components.
 */

export const nodeDocumentation = {
  // ============================================
  // GUIDE
  // ============================================
  gettingStarted: {
    title: "Getting Started",
    category: "Guide",
    description:
      "Welcome to IOSANS V2. A sovereign, offline-first workflow automation platform running entirely in your browser.",
    isGuide: true,
    content: `
### What is IOSANS?
IOSANS (Input/Output Sovereign Agentic Network System) operates on a "Sovereign" architecture. Unlike Zapier or n8n cloud, **everything runs on your device**. 
- **Privacy**: Your data never leaves your browser unless you explicitly send it (via HTTP Request).
- **Power**: It leverages your local GPU for AI (WebLLM) and local CPU for Python (Pyodide).

### Your First Workflow
Let's build a simple "Hello World" flow to understand the basics.

1.  **Trigger**: Drag a **Manual Trigger** node onto the canvas.
    -   *Why?* This gives you a "Run" button to start the flow.
2.  **Action**: Drag a **Code Executor (JS)** node.
    -   *Connect*: Draw a line from the Trigger's **Right Handle** to the Code Node's **Left Handle**.
    -   *Config*: Open the node and enter: \`return { msg: "Hello " + input.payload };\`
3.  **Output**: Drag an **Workflow Output** node.
    -   *Connect*: Draw a line from the Code Node to the Output Node.
4.  **Run It**: 
    -   Click the **Play (▶)** button on the top-left toolbar.
    -   Watch the signals flow (lighting up edges).
    -   Check the Output node to see your message!

### Navigation Shortcut keys
- **Delete**: Remove selected node.
- **Ctrl+S**: Export/Save workflow.
- **Scroll**: Pan canvas.
- **Pinch/Ctrl+Scroll**: Zoom.
    `,
  },

  triggersGuide: {
    title: "Triggers & Events",
    category: "Guide",
    description:
      "The heartbeat of your automation. How execution begins and propagates.",
    isGuide: true,
    content: `
### The "Signal" Concept
IOSANS uses a "Signal Propagation" engine.
1.  **Origin**: A signal is born at a Trigger Node.
2.  **Payload**: The signal carries a JSON object (the "Data").
3.  **Flow**: It travels along Edges to the next node.
4.  **Execution**: When a node receives a signal, it wakes up, processes the data, and passes a *new* modified signal forward.

### Trigger Types
- **Manual Trigger**: The most common for testing and attended automation. You click, it runs.
- **Schedule Trigger**: A background process.
    -   *Requirement*: The specific IOSANS browser tab MUST be open and active.
    -   *Accuracy*: It runs a check every few seconds. It is reliable for "Every Hour" tasks but not for millisecond-precision audio sync.

### Multiple Triggers?
Yes! You can connect multiple triggers to the same Action.
- *Example*: A "Daily Schedule" AND a "Manual Button" both connected to a "Scrape News" action. The action runs if *either* fires.
    `,
  },

  aiAgentsGuide: {
    title: "AI Agents",
    category: "Guide",
    description:
      "Mastering the ReAct Loop (Reasoning + Acting) with Local LLMs.",
    isGuide: true,
    content: `
### The Brain: AI Agent Node
The AI Agent is not just a chatbot. It is a **Reasoning Engine**.
- It receives a goal (Prompt).
- It looks at what Tools it has (search, python, email).
- It "thinks" step-by-step to achieve the goal.

### Binding Resources
The Agent Node has specialized Resource Slots (Top/Bottom) that define its capabilities.
1.  **Model Slot (Top)**: **REQUIRED**.
    -   Connect an **LLM Node** here.
    -   This provides the "Intelligence" (e.g., Llama-3, Phi-3). Without it, the agent is brain-dead.
2.  **Tool Slot (Bottom)**: **OPTIONAL**.
    -   Connect **one or more** Tool nodes (Python, HTTP, Search).
    -   *Magic*: The Agent parses the tool's description and decides *when* to use it.
    -   *Example*: If you ask "What is 234 * 492?", and a Python tool is connected, the Agent will write Python code to calculate it instead of guessing.

### System Prompt Engineering
The "System Prompt" config is where you program the Agent's behavior.
- **Persona**: "You are a senior data analyst."
- **Constraints**: "Never make up facts. usage JSON format."
- **CoT (Chain of Thought)**: "Think step-by-step before answering."
    `,
  },

  ddebuggingGuide: {
    title: "Debugging & Tips",
    category: "Guide",
    description: "How to troubleshoot when things go wrong.",
    isGuide: true,
    content: `
### 1. The Output Node Spy
The execution runs fast. To see what actually happened at a specific step:
- **Branch Off**: Drag an **Workflow Output** node and connect it to *any* output handle in the middle of your chain.
- It acts like a \`console.log\` probe. It won't affect the main flow but will capture the data at that point.
1.  **Execution Logs**
Open the **Right Panel** and switch to the **Logs** tab.
- It shows a chronological feed of every node execution.
- **Green**: Success.
- **Red**: Error (Click to expand details).
2.  **Common Errors**
- **"Model not loaded"**: The WebLLM engine needs to download weights (2-4GB) on the first run. Check the browser console (F12) for download progress.
- **"Python Error"**: Pyodide is strict. Ensure you indent correctly and return data.
- **"Network Error"**: Browser CORS security prevents fetching data from most sites (like Google or API endpoints without headers). Use a CORS proxy or an API designed for public access.
3.  **Browser DevTools (F12)**
Since IOSANS runs locally, the Chrome/Edge DevTools are your best friend.
- **Console Tab**: See raw system logs.
- **Network Tab**: Inspect HTTP Request node calls.
- **Application Tab**: Clear LocalStorage ("iosans-workflow") if the app freezes.
    `,
  },

  pythonGuide: {
    title: "Python Scripting",
    category: "Guide",
    description: "Using the embedded Python 3.11 environment (Pyodide).",
    isGuide: true,
    content: `
### Pyodide Architecture
IOSANS embeds **Pyodide**, a port of CPython to WebAssembly.
- **It runs in your browser**. No server is involved.
- **Benefits**: Zero latency (after load), absolute privacy.
- **Limitations**: No raw socket access (no \`requests\` library). You must use JavaScript fetch (via the HTTP Node) or Pyodide's specific fetch wrappers.

### Standard Library
Most of the Python standard library is available: \`math\`, \`random\`, \`datetime\`, \`json\`, \`re\`.

### External Packages (Micropip)
Pyodide supports pure-python wheels.
- **Included**: \`numpy\`, \`pandas\`, \`matplotlib-inline\`.
- **To Install**: Use \`await micropip.install('package_name')\` inside your script node (if supported).

### Input / Output Contract
- **Input**: The data from the previous node is injected as a global dictionary named \`input_data\`.
- **Output**: The RETURN value of the script is passed to the next node.
- **Printing**: \`print()\` statements appear in the Execution Logs provided by the dashboard.
    `,
  },

  // ============================================
  // TRIGGERS
  // ============================================
  manualTrigger: {
    title: "Manual Trigger",
    image: "/docs/manualTrigger.png",
    category: "Trigger",
    description:
      "The primary starting point for on-demand workflow execution. It listens for user interactions via the Dashboard Play button or the node's own 'Run' button.",
    howItWorks:
      "When activated, this node generates an initial 'Start' signal with an empty payload (or configured test payload). This signal propagates downstream to all connected nodes, initiating the processing chain.",
    howToUse: [
      "Drag this node onto the canvas as the very first step of your flow.",
      "Connect its Right Handle to the first Action or Logic node.",
      "Click the 'Run Flow' button in the toolbar to test your entire graph.",
      "Double-click the node to add a static JSON payload for testing specific scenarios.",
    ],
    inputs: [],
    outputs: [
      {
        id: "source",
        label: "Flow Output (Right)",
        description: "Emits the execution signal + optional JSON payload.",
      },
    ],
    configuration: [
      {
        name: "Test Payload",
        description: "JSON data to simulate an incoming webhook or user input.",
      },
    ],
    examples: [
      {
        title: "Testing User Input",
        description:
          'Simulate a user submitting a form by adding `{"name": "Alice", "email": "alice@example.com"}` to the test payload.',
        code: `{"name": "Alice"}`,
      },
    ],
    tips: "You can have multiple Manual Triggers in one workflow to create different entry points for testing (e.g., 'Test Path A' vs 'Test Path B').",
  },

  scheduleTrigger: {
    title: "Schedule Trigger",
    image: "/docs/scheduleTrigger.png",
    category: "Trigger",
    description:
      "A rigorous time-based activator that executes your workflow automatically at set intervals. Supports both simple presets and complex Cron expressions.",
    howItWorks:
      "This node registers a background timer in the browser (using `setTimeout`). When the system clock matches the configured schedule, it fires an execution signal. Since it runs in the browser, the IOSANS tab must be open for it to fire.",
    howToUse: [
      "Open the Config Panel for the node.",
      "**Mode Selection**: Choose 'Simple' for basic intervals (e.g., Every 5 Minutes) or 'Advanced' for Cron.",
      "**Cron Syntax**: Use standard Unix cron (e.g., `0 9 * * 1` for 9 AM every Monday).",
      "**Toggle Active**: Set the switch to 'Green' (Active) to enable the timer.",
    ],
    inputs: [],
    outputs: [
      {
        id: "source",
        label: "Flow Output (Right)",
        description: "Emits a signal containing the execution timestamp.",
      },
    ],
    configuration: [
      {
        name: "Mode",
        description: "Simple (Presets) or Advanced (Cron Expression).",
      },
      {
        name: "Interval / Cron",
        description: "The timing rule. E.g., '15' (minutes) or '*/15 * * * *'.",
      },
      {
        name: "active",
        description: "Master switch. If OFF, the schedule is ignored.",
      },
    ],
    examples: [
      {
        title: "Daily Morning Report",
        description: "Runs every day at 08:00 AM.",
        code: "0 8 * * *",
      },
      {
        title: "Every 5 Minutes (Weekdays)",
        description: "Monday to Friday only.",
        code: "*/5 * * * 1-5",
      },
    ],
    tips: "For complex schedules like 'Every 15 minutes only on weekdays', use a Cron generator tool. Remember: IF THE BROWSER TAB IS CLOSED, THE SCHEDULE WILL NOT RUN.",
  },

  // ============================================
  // LOGIC
  // ============================================
  ifElse: {
    title: "If / Else",
    image: "/docs/ifElse.png",
    category: "Logic",
    description:
      "A binary decision gate that splits the workflow into two distinct paths (True or False) based on a data condition.",
    howItWorks:
      "It inspects the incoming JSON data using a Property Path (e.g., `data.user.age`). It compares the value against your criteria (Equals, Greater Than, Contains, etc.).\n- **True**: Execution proceeds ONLY via the Top-Right handle.\n- **False**: Execution proceeds ONLY via the Bottom-Right handle.",
    howToUse: [
      "Connect an upstream node to the Left Input.",
      "Open Config: Set 'Property' to the field you want to check (e.g., `status`).",
      "Set 'Operator' (e.g., `Equals`) and 'Value' (e.g., `success`).",
      "Connect the 'True' output to your success handler nodes.",
      "Connect the 'False' output to error handling or alternative logic.",
    ],
    inputs: [
      {
        id: "target",
        label: "Flow Input (Left)",
        description: "Incoming JSON data to evaluate.",
      },
    ],
    outputs: [
      {
        id: "true",
        label: "True (Top-Right)",
        description: "Path taken if condition evaluates to TRUE.",
      },
      {
        id: "false",
        label: "False (Bottom-Right)",
        description: "Path taken if condition evaluates to FALSE.",
      },
    ],
    configuration: [
      {
        name: "Property",
        description:
          "Dot-notation path to the data field (e.g. `body.status`).",
      },
      {
        name: "Operator",
        description:
          "Comparison Logic: Equals, Not Equals, >, <, Contains, Exists.",
      },
      {
        name: "Value",
        description:
          "The target value to compare against (String, Number, Boolean).",
      },
    ],
    examples: [
      {
        title: "Filter Success API Calls",
        description: "Check if the API status is 200.",
        code: "Property: status\nOperator: Equals\nValue: 200",
      },
      {
        title: "Detect User Email",
        description: "Check if the input object contains an email field.",
        code: "Property: user.email\nOperator: Exists",
      },
    ],
    tips: "Access nested data using dot notation: `response.body.items[0].id`. Use 'Exists' operator to check for missing data fields.",
  },

  switch: {
    title: "Switch",
    image: "/docs/switch.png",
    category: "Logic",
    description:
      "A multi-way router that pushes data down a specific matching path. Cleaner than chaining multiple If/Else nodes.",
    howItWorks:
      "Takes a single 'Key' from the input data (e.g., `category`). It matches the value of that key against a list of defined Cases. If `category` == 'sports', it fires the 'sports' output handle.",
    howToUse: [
      "Open Config: Define the 'Property Key' to inspect (e.g., `fileType`).",
      "Add Cases: Create a case for each expected value (e.g., `pdf`, `jpg`, `txt`).",
      "Connect the dynamically created Right Handles to their respective processing chains.",
      "Use the 'Default' output (if available) for unmatched values.",
    ],
    inputs: [
      {
        id: "target",
        label: "Flow Input (Left)",
        description: "Data object containing the property to switch on.",
      },
    ],
    outputs: [
      {
        id: "case-X",
        label: "Case Handles (Right)",
        description:
          "One handle per defined case. Only the matching handle fires.",
      },
    ],
    configuration: [
      {
        name: "Property Key",
        description: "The JSON key to route by (e.g. `type`).",
      },
      {
        name: "Cases",
        description: "List of possible values (routes).",
      },
    ],
    examples: [
      {
        title: "File Router",
        description: "Route processing based on file extension.",
        code: "Key: file_ext\nCases: ['pdf', 'png', 'docx']",
      },
    ],
    tips: "String matching is case-sensitive! Ensure your input data is normalized if you expect mixed casing.",
  },

  merge: {
    title: "Merge",
    image: "/docs/merge.png",
    category: "Logic",
    description:
      "A synchronization gate that waits for multiple parallel execution branches to finish before continuing. Essential for 'Scatter-Gather' patterns.",
    howItWorks:
      "The Merge node maintains an internal counter. You configure it to expect 'N' signals. It effectively PAUSES execution until it has received exactly N inputs. Once satisfied, it bundles all input data into an array and fires its output.",
    howToUse: [
      "Place this node where multiple logic branches need to rejoin (e.g., after an If/Else split or parallel HTTP requests).",
      "**Crucial**: In the Config Panel, set 'Expected Branches' to the exact number of connections coming into the Left Handle.",
      "Connect the Output to the next step (e.g., Final Summary or Output View).",
    ],
    inputs: [
      {
        id: "target",
        label: "Flow Input (Left)",
        description: "Connect multiple upstream branches here.",
      },
    ],
    outputs: [
      {
        id: "source",
        label: "Flow Output (Right)",
        description: "Fires once (and only once) when all branches arrive.",
      },
    ],
    configuration: [
      {
        name: "Expected Branches",
        description: "The exact Integer number of input signals to wait for.",
      },
    ],
    examples: [
      {
        title: "Parallel Search",
        description:
          "Wait for both Google Search and Wikipedia Search to finish.",
        code: "Expected Branches: 2",
      },
    ],
    tips: "If a branch hangs or errors out upstream, the Merge node will wait forever. Ensure all paths eventually reach the Merge or handle errors gracefully.",
  },

  delay: {
    title: "Delay",
    image: "/docs/delay.png",
    category: "Logic",
    description:
      "A precise execution pauser. Use this to rate-limit loops, wait for external API consistency, or simply pace a demo.",
    howItWorks:
      "When a signal arrives, the node stores the payload and sets a JavaScript timeout. Execution downstream is completely blocked until the timer expires. After the delay, it passes the original data forward unchanged.",
    howToUse: [
      "Insert in the flow where you need a pause.",
      "Set the 'Duration' in milliseconds (e.g., 2000 for 2 seconds).",
      "Useful in loops to avoid hitting API Rate Limits (429 Too Many Requests).",
    ],
    inputs: [
      {
        id: "target",
        label: "Flow Input (Left)",
        description: "Data to hold.",
      },
    ],
    outputs: [
      {
        id: "source",
        label: "Flow Output (Right)",
        description: "Fires exact payload after duration expires.",
      },
    ],
    configuration: [
      {
        name: "Duration (ms)",
        description: "Wait time in milliseconds. 1000 ms = 1 Second.",
      },
    ],
    examples: [
      {
        title: "Rate Limit API",
        description: "Wait 1 second between API calls.",
        code: "Duration: 1000",
      },
    ],
    tips: "You can randomize the delay duration in the advanced config to simulate human behavior (e.g., for scraping tasks).",
  },

  // ============================================
  // ACTIONS
  // ============================================
  codeExecutor: {
    title: "Code Executor (JS)",
    image: "/docs/codeExecutor.png",
    category: "Action",
    description:
      "The ultimate fallback. Execute raw JavaScript to perform complex data manipulation, math, or logic that no standard node supports.",
    howItWorks:
      "Uses a sandboxed `Function()` constructor. The previous node's output is injected as a variable named `input`. Your code MUST end with a `return` statement to pass data to the next node.",
    howToUse: [
      "Open the Code Editor in the Right Panel.",
      "Write standard JS. No `import`/`require` allowed (synchronous logic only).",
      "Access data via `input`. Example: `const val = input.field || 0;`.",
      "**Return Data**: `return { result: val * 2 };`.",
    ],
    inputs: [
      {
        id: "target",
        label: "Flow Input (Left)",
        description: "Available as `input` variable.",
      },
    ],
    outputs: [
      {
        id: "source",
        label: "Flow Output (Right)",
        description: "Whatever object or value you `return` from the script.",
      },
    ],
    configuration: [
      {
        name: "Code Editor",
        description: "The JavaScript code body to execute.",
      },
    ],
    examples: [
      {
        title: "Extract Email Domain",
        description: "Simple string manipulation.",
        code: `const email = input.email;
const domain = email.split('@')[1];
return { domain: domain };`,
      },
      {
        title: "Math Calculation",
        description: "Calculate order total.",
        code: `return { total: input.price * input.quantity };`,
      },
    ],
    tips: "If you return a Promise, the system waits for it to resolve! Useful for `fetch` (though HTTP Node is preferred). Errors in code will stop the workflow.",
  },

  httpRequest: {
    title: "HTTP Request",
    image: "/docs/httpRequest.png",
    category: "Action",
    description:
      "The bridge to the outside world. Perform REST API calls (GET, POST, PUT, DELETE) to any accessible URL.",
    howItWorks:
      "Uses the browser's native `fetch` API. It means calls originate *from your IP address* client-side. CORS (Cross-Origin Resource Sharing) restrictions apply.",
    howToUse: [
      "**URL**: Enter the endpoint API address.",
      "**Method**: Select GET (read) or POST (write).",
      "**Headers**: Add Auth tokens or Content-Type headers in JSON format (e.g., `{'Authorization': 'Bearer ...'}`).",
      "**Body**: By default, the input node's data is sent as the JSON body (for POST). You can override this.",
    ],
    inputs: [
      {
        id: "target",
        label: "Flow Input (Left)",
        description: "Used as Payload (Body) for POST/PUT. Ignored for GET.",
      },
    ],
    outputs: [
      {
        id: "source",
        label: "Flow Output (Right)",
        description: "The API Response (Status, Headers, Body).",
      },
    ],
    configuration: [
      {
        name: "Method",
        description: "GET, POST, PUT, DELETE, PATCH.",
      },
      {
        name: "URL",
        description: "Destination Endpoint. Supports https://.",
      },
      {
        name: "Headers (JSON)",
        description: "Key-Value pairs for auth. `{'Authorization': '...'}`.",
      },
    ],
    examples: [
      {
        title: "Get Weather (Public API)",
        description: "Fetch JSON data.",
        code: "Method: GET\nURL: https://api.weather.gov/gridpoints/TOP/31,80/forecast",
      },
      {
        title: "Post to Webhook",
        description: "Send data to Zapier/Discord.",
        code: "Method: POST\nURL: https://hooks.zapier.com/...\nBody: (Input Data)",
      },
    ],
    tips: "If you get a 'Network Error', checking the Browser Console (F12) usually reveals a CORS issue. Use a CORS proxy if the API doesn't allow browser calls.",
  },

  transform: {
    title: "Transform",
    image: "/docs/transform.png",
    category: "Action",
    description:
      "A dedicated data-shaper. Clean, map, and restructure messy JSON inputs into clean objects for downstream nodes.",
    howItWorks:
      "Applies a transformation function to the input. Designed to be simpler than writing full JS code for common tasks like picking fields.",
    howToUse: [
      "Select a 'Operation':",
      "- **Pick**: Whitelist specific keys to keep.",
      "- **Exclude**: Blacklist keys to remove.",
      "- **Stringify**: Convert Object -> String.",
      "- **Parse**: Convert String -> Object.",
    ],
    inputs: [
      {
        id: "target",
        label: "Flow Input (Left)",
        description: "Raw Data Object.",
      },
    ],
    outputs: [
      {
        id: "source",
        label: "Flow Output (Right)",
        description: "Transformed Data.",
      },
    ],
    configuration: [
      {
        name: "Transform Type",
        description: "Pick, Exclude, Stringify, Parse.",
      },
      {
        name: "Fields",
        description: "Comma-separated list of keys (for Pick/Exclude).",
      },
    ],
    examples: [
      {
        title: "Clean API Response",
        description: "Keep only relevant user info.",
        code: "Type: Pick\nFields: id, name, email",
      },
    ],
    tips: "Use this before an 'HTTP Request' to strip internal fields (like `id`) before sending data to an API.",
  },

  // ============================================
  // AI
  // ============================================
  aiAgent: {
    title: "AI Agent",
    image: "/docs/aiAgent.png",
    category: "AI",
    description:
      "A ReAct (Reasoning + Acting) Agent. It uses an LLM to 'think' about a problem and autonomously call Tools to solve it.",
    howItWorks:
      "1. Receives a user prompt.\n2. Queries the attached Model (Top Slot) with the prompt + descriptions of attached Tools (Bottom Slot).\n3. The LLM decides if it needs to run a tool (e.g., 'Search Google').\n4. The Agent executes the tool, feeds the result back to the LLM, and repeats until the task is done.",
    howToUse: [
      "**Input**: Connect the prompt to the Left Handle.",
      "**Model**: Connect a 'LLM' Node to the Top Handle (REQUIRED).",
      "**Tools**: Connect one or more 'Tool' nodes (Python, Search) to the Bottom Handle.",
      "**System Prompt**: Give the agent a persona (e.g., 'You are a helpful coding assistant').",
    ],
    inputs: [
      {
        id: "target",
        label: "Flow Input (Left)",
        description: "Prompt / Context String.",
      },
      {
        id: "model",
        label: "Model Slot (Top)",
        description: "Must connect an LLM node or the agent has no brain.",
      },
      {
        id: "tool",
        label: "Tool Slot (Bottom)",
        description: "Tools give the agent capabilities (Search, Calculate).",
      },
    ],
    outputs: [
      {
        id: "source",
        label: "Flow Output (Right)",
        description: "The Final Answer (String) after all reasoning steps.",
      },
    ],
    configuration: [
      {
        name: "System Prompt",
        description: "Top-level instructions for the agent's behavior/persona.",
      },
      {
        name: "Temperature",
        description: "Creativity (0.0 - 1.0). Default 0.7.",
      },
      {
        name: "Max Steps",
        description:
          "Safety limit to prevent infinite reasoning loops. Default 5.",
      },
    ],
    examples: [
      {
        title: "Data Analyst Agent",
        description: "Agent that can code in Python and query data.",
        code: "System Prompt: 'You are a Python Expert. Always write code to solve math problems.'\nTools: Python Node",
      },
    ],
    tips: "More instructions in the System Prompt usually leads to better performance. Explicitly tell it: 'Always use the Python tool for math'.",
  },

  llm: {
    title: "LLM (Chat)",
    image: "/docs/llm.png",
    category: "AI",
    description:
      "A direct interface to Large Language Models. Use this when you just need text generation without complex tool usage or multi-step reasoning.",
    howItWorks:
      "Sends the input prompt to the configured Local Model (WebLLM - running on your GPU) or API Model. Returns the raw text completion.",
    howToUse: [
      "Connect a string prompt to the Left Handle.",
      "Select a Model in config (e.g., `Llama-3-8B-Quantized`).",
      "Adjust 'Temperature': Lower (0.1) for facts, Higher (0.8) for creative writing.",
    ],
    inputs: [
      {
        id: "target",
        label: "Flow Input (Left)",
        description: "User Prompt.",
      },
      {
        id: "model",
        label: "Model Slot (Bottom)",
        description: "(Advanced) Inject dependencies or override config.",
      },
    ],
    outputs: [
      {
        id: "source",
        label: "Flow Output (Right)",
        description: "Generated Text.",
      },
    ],
    configuration: [
      {
        name: "Model ID",
        description: "Select from available WebLLM models.",
      },
      {
        name: "Temperature",
        description: "0.0 (Strict) to 1.0 (Creative).",
      },
    ],
    examples: [
      {
        title: "Summarizer",
        description: "Summarize a long text input.",
        code: "Prompt: 'Summarize the following text: ' + input.text",
      },
    ],
    tips: "This node is faster than an Agent. Use it for summarization, translation, or generating creative content.",
  },

  // ============================================
  // TOOLS
  // ============================================
  python: {
    title: "Python (Pyodide)",
    image: "/docs/python.png",
    category: "Tools",
    description:
      "A full Python 3.11 environment running locally via WebAssembly. Gives your Agent (or Workflow) the power of a real programming language.",
    howItWorks:
      "Downloads the Pyodide runtime (~10MB) once. Executes code in isolation. Can load pure-python libraries (micropip) like NumPy, Pandas, and Math.",
    howToUse: [
      "**Action Mode**: Use it in the flow to process data. Accessible as `input_data` variable.",
      "**Tool Mode**: Connect to an AI Agent. The Agent will call this tool and write code for you to solve problems.",
      "**StdOut**: Use `print()` to output logs.",
      "**Return**: The last expression value is returned automatically.",
    ],
    inputs: [
      {
        id: "target",
        label: "Flow Input (Left)",
        description: "Data available as `input_data` dict.",
      },
    ],
    outputs: [
      {
        id: "source",
        label: "Flow Output (Right)",
        description: "Execution Result.",
      },
    ],
    configuration: [
      {
        name: "Script",
        description: "Python code to execute.",
      },
    ],
    examples: [
      {
        title: "Calculate Fibonacci",
        description: "Standard recursive function.",
        code: `def fib(n):
    return n if n < 2 else fib(n-1) + fib(n-2)
fib(10)`,
      },
      {
        title: "Process JSON",
        description: "Read input data.",
        code: `import json
data = input_data['body']
print("Processing " + data['id'])`,
      },
    ],
    tips: "Heavy computations (matrix math) might freeze the UI briefly since it runs on the main thread (for now).",
  },

  textToSpeech: {
    title: "Text to Speech",
    image: "/docs/textToSpeech.png",
    category: "Tools",
    description:
      "Converts text strings into playable audio blobs using the browser's native Speech Synthesis or external APIs.",
    howItWorks:
      "Uses `window.speechSynthesis` or connected TTS API. Generates an Audio Blob URL that the Output Node can render as a player.",
    howToUse: [
      "Connect text input.",
      "Select Voice (Male/Female/Robot).",
      "Connect Output to a 'Output Node' to hear the result.",
    ],
    inputs: [
      {
        id: "target",
        label: "Flow Input (Left)",
        description: "Text to speak.",
      },
    ],
    outputs: [
      {
        id: "source",
        label: "Flow Output (Right)",
        description: "Rich Media Artifact (Audio).",
      },
    ],
    configuration: [
      {
        name: "Voice",
        description: "Select available system voice.",
      },
      {
        name: "Rate",
        description: "Speed (0.5 - 2.0).",
      },
      {
        name: "Pitch",
        description: "Tone (0.0 - 2.0).",
      },
    ],
    examples: [
      {
        title: "Announce Alert",
        description: "Speak an error message.",
        code: "Input: 'System Failure Detected!'",
      },
    ],
    tips: "Browser voices vary by OS (Windows vs Mac vs Android).",
  },

  imageGeneration: {
    title: "Image Generation",
    image: "/docs/imageGeneration.png",
    category: "Tools",
    description:
      "Creates visual assets from text prompts. Connects to local or remote diffusion models.",
    howItWorks:
      "Sends the prompt to the backend generation engine. Returns a strict Blob/Base64 image object.",
    howToUse: [
      "Input a descriptive prompt (e.g., 'A cyberpunk city at night, neon lights').",
      "Config: Set Aspect Ratio (1:1, 16:9).",
      "Connect to 'Output Node' to view the generated image.",
    ],
    inputs: [
      {
        id: "target",
        label: "Flow Input (Left)",
        description: "Image Prompt.",
      },
    ],
    outputs: [
      {
        id: "source",
        label: "Flow Output (Right)",
        description: "Image Artifact.",
      },
    ],
    configuration: [
      {
        name: "Prompt",
        description: "Description of image to generate.",
      },
      {
        name: "Negative Prompt",
        description: "What to avoid (e.g. 'blurry').",
      },
      {
        name: "Steps",
        description: "Denoising steps (Method dependent).",
      },
    ],
    examples: [
      {
        title: "Logo Concept",
        description: "Generate vector art style logo.",
        code: "Prompt: 'Minimalist fox logo, vector art, flat color, white background'",
      },
    ],
    tips: "Use negative prompts to exclude unwanted elements (e.g., 'blurry, low quality').",
  },

  // ============================================
  // I/O
  // ============================================
  output: {
    title: "Workflow Output",
    image: "/docs/output.png",
    category: "I/O",
    description:
      "The universal viewer. It intelligently detects content type (Text, JSON, Image, Audio) and renders the appropriate viewer (Player, Image Viewer, JSON Tree).",
    howItWorks:
      "Acts as a 'sink'. It does not pass data forward. It is the final destination for visualization.",
    howToUse: [
      "Place at the end of any branch.",
      "Great for debugging intermediate steps—just branch off a connection to an Output node to 'spy' on the data.",
    ],
    inputs: [
      {
        id: "target",
        label: "Flow Input (Left)",
        description: "Any data type.",
      },
    ],
    outputs: [], // No outputs
    configuration: [
      {
        name: "View Mode",
        description: "Auto, JSON, Text, Media (detected automatically).",
      },
    ],
    examples: [
      {
        title: "Debug Probe",
        description: "Inspect data in the middle of a flow.",
        code: "Connect alongside the main flow path.",
      },
    ],
    tips: "You can drag multiple output nodes to monitor different parts of a complex workflow simultaneously.",
  },
};
