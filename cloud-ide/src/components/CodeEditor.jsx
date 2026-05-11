import React, { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  useToast,
  IconButton,
  Tooltip,
  Flex,
  Divider,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  useDisclosure
} from "@chakra-ui/react";
import { Editor, useMonaco } from "@monaco-editor/react";
import { CODE_SNIPPETS } from "../constants";
import { privateApi, executeCode } from "./api";
import { FiPlay, FiUsers, FiLink2, FiCpu, FiLogOut } from "react-icons/fi"; // FiCpu is the AI icon
import Output from "./Output";
import LanguageSelector from "./LanguageSelector";
import CodeforcesLoader from "./CodeforcesLoader";

// --- Remote Cursor CSS & Classes (Kept exactly as you had them) ---
const cursorStyles = `
  .remote-cursor { 
    border-left: 2px solid; 
    pointer-events: none; 
  }
  .remote-cursor-label { 
    color: white; 
    font-size: 10px; 
    padding: 1px 4px; 
    border-radius: 3px; 
    white-space: nowrap; 
    pointer-events: none;
    margin-left: 2px;
  }
  .remote-selection { 
    opacity: 0.3; 
    pointer-events: none; 
  }
`;

const getUserColor = (username) => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) { hash = username.charCodeAt(i) + ((hash << 5) - hash); }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

class RemoteCursorManager {
  constructor(editor, monacoInstance, username, color) {
    this.editor = editor;
    this.monaco = monacoInstance;
    this.username = username;

    // Remove spaces/special characters so we can use it as a safe CSS class
    this.safeName = username.replace(/[^a-zA-Z0-9]/g, '');
    this.color = color;

    this.cursorDecoration = [];
    this.selectionDecoration = [];

    // Inject dynamic CSS to apply this specific user's color!
    if (!document.getElementById(`cursor-style-${this.safeName}`)) {
      const style = document.createElement("style");
      style.id = `cursor-style-${this.safeName}`;
      style.innerHTML = `
        .cursor-${this.safeName} { border-left-color: ${color} !important; }
        .label-${this.safeName} { background-color: ${color} !important; }
        .selection-${this.safeName} { background-color: ${color} !important; }
      `;
      document.head.appendChild(style);
    }
  }
  updateCursor(position) {
    if (!this.monaco) return;
    
    const newCursorDecoration = { 
      range: new this.monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column), 
      options: { 
        className: `remote-cursor cursor-${this.safeName}`, 
        stickiness: this.monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges, 
        
        // --- ADD THIS LINE: This creates the hover tooltip! ---
        hoverMessage: { value: `**${this.username}** is typing...` }, 
        
        after: { 
          content: ` ${this.username} `, 
          inlineClassName: `remote-cursor-label label-${this.safeName}` 
        } 
      } 
    };
    this.cursorDecoration = this.editor.deltaDecorations(this.cursorDecoration, [newCursorDecoration]);
  }

  updateSelection(selection) {
    if (!this.monaco) return;

    const newSelectionDecoration = {
      range: new this.monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn),
      options: {
        className: `remote-selection selection-${this.safeName}`,
        stickiness: this.monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
      }
    };
    this.selectionDecoration = this.editor.deltaDecorations(this.selectionDecoration, [newSelectionDecoration]);
  }

  remove() {
    this.editor.deltaDecorations(this.cursorDecoration, []);
    this.editor.deltaDecorations(this.selectionDecoration, []);
  }
}

const BASE_WS_URL = "wss://cloud-ide-backend-o772.onrender.com/ws/editor/";

const CodeEditor = () => {
  const { token: roomToken } = useParams();
  const editorRef = useRef(null);
  const wsRef = useRef(null);
  const remoteCursorsRef = useRef(new Map());
  const monaco = useMonaco();

  const [value, setValue] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [stdin, setStdin] = useState("");
  const [problem, setProblem] = useState(null);
  const [output, setOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // --- AI State ---
  const { isOpen: isAiOpen, onOpen: onAiOpen, onClose: onAiClose } = useDisclosure();
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const isCollaborating = !!roomToken && roomToken !== "new";
  const isHost = localStorage.getItem(`isHost_${roomToken}`) === "true";
  const toast = useToast();
  const navigate = useNavigate();

  // --- WebSocket Setup ---
  useEffect(() => {
    if (!roomToken || !monaco || !isCollaborating) return;
    const accessToken = localStorage.getItem("access");
    if (!accessToken) return;

    const WS_URL = `${BASE_WS_URL}${roomToken}/?token=${accessToken}`;
    if (wsRef.current) wsRef.current.close();
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      if (typeof event.data !== "string") return;

      try {
        const message = JSON.parse(event.data);
        const payload = message.data; // The actual event data
        const username = message.user?.username; // FIX: Extract the string, not the object!

        const editor = editorRef.current;
        if (!editor || !username || !monaco) return;

        // Create a cursor for the user if they don't have one yet
        if (!remoteCursorsRef.current.has(username) && payload.type !== "user_left") {
          remoteCursorsRef.current.set(
            username,
            new RemoteCursorManager(editor, monaco, username, getUserColor(username))
          );
        }

        const cursorManager = remoteCursorsRef.current.get(username);

        switch (payload.type) {
          case "code_change": // MATCHES BACKEND
            setValue(payload.code);
            break;

          case "language_change": // MATCHES BACKEND
            setLanguage(payload.language);
            break;

          case "problem_loaded": // MATCHES BACKEND
            setProblem(payload.problem);
            break;

          case "input_change":
            setStdin(payload.stdin || "");
            break;

          case "selection_update":
            if (cursorManager) {
              if (payload.selection) cursorManager.updateSelection(payload.selection);
              if (payload.position) cursorManager.updateCursor(payload.position);
            }
            break;

          case "user_left":
            if (cursorManager) {
              cursorManager.remove();
              remoteCursorsRef.current.delete(username);
            }
            break;

          case "room_state":
            // Late joiner magic
            setValue(payload.code || "");
            setLanguage(payload.language || "cpp");
            if (payload.problem) setProblem(payload.problem);
            break;

          case "session_terminated":
            toast({
              title: "Session Ended",
              description: "The host has terminated this live session.",
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
            // Force the user out of the room immediately!
            navigate("/editor/new", { replace: true });
            break;

          default:
            break;
        }
      } catch (e) {
        console.error("WS Parse Error:", e);
      }
    };
    return () => {
      ws.close();
      remoteCursorsRef.current.forEach((manager) => manager.remove());
      remoteCursorsRef.current.clear();
    };
  }, [roomToken, navigate, monaco, isCollaborating]);

  // --- AI Code Generation with Typing Effect ---
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;

    setIsAiLoading(true);
    try {
      // 1. Fetch the code from your Django Backend
      const res = await privateApi.post("/api/ai/generate/", {
        prompt: aiPrompt,
        code: value,
        language: language
      });

      const newCode = res.data.generated_code;

      onAiClose(); // Close modal so user can watch the typing
      setAiPrompt("");

      // 2. Clear the editor to prepare for the AI typing
      setValue("");

      // 3. The Typewriter Effect Logic
      let currentIndex = 0;

      const typeInterval = setInterval(() => {
        if (currentIndex < newCode.length) {
          // Grab 3 characters at a time for realistic typing speed
          const chunk = newCode.slice(currentIndex, currentIndex + 3);

          setValue(prev => {
            const nextValue = prev + chunk;
            // Broadcast every keystroke over WebSocket! Collaborators see it live!
            if (isCollaborating && wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: "code_update", code: nextValue }));
            }
            return nextValue;
          });

          currentIndex += 3;
        } else {
          // Finished typing
          clearInterval(typeInterval);
          setIsAiLoading(false);
          toast({ title: "AI finished typing!", status: "success", duration: 2000 });
        }
      }, 15); // Executes every 15ms

    } catch (error) {
      setIsAiLoading(false);
      toast({
        title: "AI Failed",
        description: error.response?.data?.error || "Check your API connection.",
        status: "error"
      });
    }
  };

  const runCode = async () => {
    const sourceCode = editorRef.current.getValue();
    if (!sourceCode) return;
    try {
      setIsLoading(true);
      const { run: result } = await executeCode(language, sourceCode, stdin);

      // Split the string into an array by newlines so Output.jsx can map it!
      setOutput(result.output.split("\n"));

      result.stderr ? setIsError(true) : setIsError(false);
    } catch (error) {
      toast({ title: "Error", description: "Execution failed", status: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartCollaboration = async () => {
    try {
      const res = await privateApi.post("/api/sessions/create/", { initial_code: value, language, problem_data: problem });
      if (res.data.token) {
        localStorage.setItem(`isHost_${res.data.token}`, "true");
        navigate(`/editor/${res.data.token}`);
      }
    } catch (error) { toast({ title: "Failed", status: "error" }); }
  };

  const handleDisconnect = () => {
    // Navigating back to "new" automatically closes the WebSocket 
    // and clears the room state!
    navigate("/editor/new", { replace: true });
    toast({
      title: "Disconnected",
      description: "You have left the live collaboration session.",
      status: "info",
      duration: 3000,
    });
  };

  const handleEndSessionForAll = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Fire the kill switch!
      wsRef.current.send(JSON.stringify({ type: "terminate_session" }));
    }
  };
  const handleProblemChange = (newProblem) => {
    setProblem(newProblem);
    if (isCollaborating && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "problem_loaded", problem: newProblem }));
    }
  };

  const onMount = (editor) => {
    editorRef.current = editor; editor.focus();
    if (!isCollaborating) setValue(CODE_SNIPPETS[language] || "");

    editor.onDidChangeCursorSelection((e) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "selection_update", position: e.selection.getPosition(), selection: e.selection }));
      }
    });
  };

  const handleEditorChange = (newValue) => {
    setValue(newValue);
    if (isCollaborating && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "code_change", code: newValue }));
    }
  };

  const handleStdinChange = (newValue) => {
    setStdin(newValue);
    if (isCollaborating && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "input_change", stdin: newValue }));
    }
  };

  const onSelect = (newLang) => {
    setLanguage(newLang); setValue(CODE_SNIPPETS[newLang] || "");
    if (isCollaborating && wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: "language_change", language: newLang }));
  };

  return (
    <Box minH="100vh" bgGradient="linear(to-br, #0a192f, #172a45)" color="white" p={{ base: 3, md: 6 }}>
      <style>{cursorStyles}</style>

      {/* Top Toolbar */}
      <Flex direction={{ base: "column", md: "row" }} justify="space-between" align={{ base: "stretch", md: "center" }} bg="rgba(255,255,255,0.05)" backdropFilter="blur(10px)" p={{ base: 3, md: 4 }} borderRadius="xl" boxShadow="0 4px 20px rgba(0,0,0,0.2)" mb={4} wrap="wrap" gap={3}>
        <HStack spacing={4} flexWrap="wrap">
          <Text fontWeight="extrabold" fontSize={{ base: "md", md: "lg" }} color="blue.300">Cloud IDE</Text>
          <Divider orientation="vertical" borderColor="gray.600" display={{ base: "none", md: "block" }} />
          <LanguageSelector language={language} onSelect={onSelect} />
        </HStack>

        <HStack spacing={3} flexWrap="wrap" mt={{ base: 2, md: 0 }}>

          {/* --- STATE 1: SOLO MODE (Session not created yet) --- */}
          {!isCollaborating && (
            <Tooltip label="Start new collaboration session">
              <Button colorScheme="green" leftIcon={<FiUsers />} onClick={handleStartCollaboration} size={{ base: "sm", md: "md" }}>
                Start Collaboration
              </Button>
            </Tooltip>
          )}

          {/* --- STATE 2: LIVE SESSION MODE --- */}
          {isCollaborating && (
            <>
              <Button colorScheme="green" leftIcon={<FiUsers />} size={{ base: "sm", md: "md" }} isDisabled>
                Live Session
              </Button>

              <Tooltip label="Copy session link">
                <Button leftIcon={<FiLink2 />} colorScheme="blue" size={{ base: "sm", md: "md" }} variant="outline" onClick={() => navigator.clipboard.writeText(window.location.href)}>
                  Copy Link
                </Button>
              </Tooltip>

              {/* EVERYONE gets the Leave button */}
              <Tooltip label="Leave the session (Others can stay)">
                <Button leftIcon={<FiLogOut />} colorScheme="orange" size={{ base: "sm", md: "md" }} onClick={handleDisconnect}>
                  Leave
                </Button>
              </Tooltip>

              {/* ONLY THE HOST gets the End for All button */}
              {isHost && (
                <Tooltip label="End this session for everyone">
                  <Button leftIcon={<FiLogOut />} bg="red.600" color="white" _hover={{ bg: "red.700" }} size={{ base: "sm", md: "md" }} onClick={handleEndSessionForAll}>
                    End for All
                  </Button>
                </Tooltip>
              )}
            </>
          )}

          {/* --- ALWAYS VISIBLE BUTTONS --- */}
          <Tooltip label="Ask AI to write code">
            <Button leftIcon={<FiCpu />} colorScheme="purple" variant="solid" size={{ base: "sm", md: "md" }} onClick={onAiOpen} isLoading={isAiLoading} loadingText="AI Thinking...">
              Ask AI
            </Button>
          </Tooltip>

          <Tooltip label="Run code">
            <IconButton icon={<FiPlay />} colorScheme="blue" variant="solid" size="sm" isLoading={isLoading} onClick={runCode} />
          </Tooltip>

        </HStack>
      </Flex>

      {/* Main Content Area */}
      <Flex direction={{ base: "column", md: "row" }} gap={4} h={{ base: "auto", md: "75vh" }}>

        {/* Left: Editor */}
        <Box flex="1" border="1px solid" borderColor="gray.700" borderRadius="md" overflow="hidden" boxShadow="0 0 25px rgba(0,0,0,0.3)">
          <Editor height="100%" theme="vs-dark" language={language} value={value} onMount={onMount} onChange={handleEditorChange} options={{ fontSize: 15, minimap: { enabled: false }, smoothScrolling: true, padding: { top: 12 }, cursorBlinking: "phase" }} />
        </Box>

        {/* Right: Input & Output */}
        <VStack w={{ base: "100%", md: "30%" }} spacing={4} align="stretch" overflowY="auto">
          <CodeforcesLoader
            onLoadSample={(input) => handleStdinChange(input)}
            problem={problem}
            onProblemChange={handleProblemChange}
          />
          <Box bg="gray.900" p={4} borderRadius="md" border="1px solid" borderColor="gray.700">
            <Text fontWeight="bold" mb={2} color="gray.400">Input</Text>
            <Textarea
              value={stdin}
              onChange={(e) => handleStdinChange(e.target.value)}
              placeholder="Enter custom input here..."
              minH="100px" bg="gray.800" border="none" color="white" resize="vertical" _focus={{ border: "1px solid", borderColor: "blue.500" }}
            />
          </Box>
          <Box flex="1" bg="gray.900" p={4} borderRadius="md" border="1px solid" borderColor="gray.700" minH="200px">
            <Text fontWeight="bold" mb={2} color="gray.400">Output</Text>
            <Output output={output} isError={isError} />
          </Box>
        </VStack>
      </Flex>

      {/* --- AI PROMPT MODAL --- */}
      <Modal isOpen={isAiOpen} onClose={onAiClose} isCentered>
        <ModalOverlay backdropFilter="blur(2px)" />
        <ModalContent bg="gray.800" color="white" border="1px solid" borderColor="purple.500">
          <ModalHeader color="purple.300">Gemini AI Assistant</ModalHeader>
          <ModalBody>
            <Text mb={2} fontSize="sm" color="gray.400">What do you want the AI to write or fix?</Text>
            <Input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. 'Write a Python script for Binary Search'"
              bg="gray.900"
              borderColor="gray.600"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAiGenerate(); }}
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAiClose} color="gray.300">Cancel</Button>
            <Button colorScheme="purple" isLoading={isAiLoading} onClick={handleAiGenerate}>
              Generate
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </Box>
  );
};


export default CodeEditor;