import React, { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Select,
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
import { FiPlay, FiUsers, FiLink2, FiCpu } from "react-icons/fi"; // FiCpu is the AI icon
import Output from "./Output";
import LanguageSelector from "./LanguageSelector";
import CodeforcesLoader from "./CodeforcesLoader";

// --- Remote Cursor CSS & Classes (Kept exactly as you had them) ---
const cursorStyles = `
  .remote-cursor { position: absolute; border-left: 2px solid; height: 1.2em; pointer-events: none; z-index: 10; }
  .remote-cursor-label { position: absolute; color: white; font-size: 10px; padding: 2px 4px; border-radius: 3px; white-space: nowrap; transform: translateY(-100%); pointer-events: none; z-index: 10; }
  .remote-selection { position: absolute; opacity: 0.3; pointer-events: none; z-index: 5; }
`;

const getUserColor = (username) => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) { hash = username.charCodeAt(i) + ((hash << 5) - hash); }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

class RemoteCursorManager {
  constructor(editor, monacoInstance, username, color) {
    this.editor = editor; this.monaco = monacoInstance; this.username = username; this.color = color;
    this.cursorDecoration = []; this.selectionDecoration = [];
  }
  updateCursor(position) {
    if (!this.monaco) return;
    const newCursorDecoration = { range: new this.monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column), options: { className: "remote-cursor", stickiness: this.monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges, after: { content: ` ${this.username} `, className: "remote-cursor-label", backgroundColor: this.color, borderColor: this.color }, borderColor: this.color } };
    this.cursorDecoration = this.editor.deltaDecorations(this.cursorDecoration, [newCursorDecoration]);
  }
  updateSelection(selection) {
    if (!this.monaco) return;
    const newSelectionDecoration = { range: new this.monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn), options: { className: "remote-selection", stickiness: this.monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges, css: { backgroundColor: this.color } } };
    this.selectionDecoration = this.editor.deltaDecorations(this.selectionDecoration, [newSelectionDecoration]);
  }
  remove() { this.editor.deltaDecorations(this.cursorDecoration, []); this.editor.deltaDecorations(this.selectionDecoration, []); }
}

const BASE_WS_URL = "ws://127.0.0.1:8000/ws/editor/";

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
        const { data, user: username } = message;
        const editor = editorRef.current;
        if (!editor || !username || !monaco) return;

        if (!remoteCursorsRef.current.has(username) && data.type !== "user_left") {
          remoteCursorsRef.current.set(username, new RemoteCursorManager(editor, monaco, username, getUserColor(username)));
        }
        const cursorManager = remoteCursorsRef.current.get(username);

        switch (data.type) {
          case "code_update": setValue(data.code); break;
          case "language_update": setLanguage(data.language); break;
          case "problem_update": setProblem(data.problem); break;
          case "selection_update":
            if (cursorManager) {
              if (data.selection) cursorManager.updateSelection(data.selection);
              if (data.position) cursorManager.updateCursor(data.position);
            }
            break;
          case "user_joined":
             if (!remoteCursorsRef.current.has(username)) remoteCursorsRef.current.set(username, new RemoteCursorManager(editor, monaco, username, getUserColor(username)));
            break;
          case "user_left":
            if (cursorManager) { cursorManager.remove(); remoteCursorsRef.current.delete(username); }
            break;
          case "room_state":
            setValue(data.code); setLanguage(data.language); if (data.problem) setProblem(data.problem);
            data.users.forEach((user) => {
              if (!remoteCursorsRef.current.has(user) && user !== localStorage.getItem("username")) {
                remoteCursorsRef.current.set(user, new RemoteCursorManager(editor, monaco, user, getUserColor(user)));
              }
            });
            break;
          default: break;
        }
      } catch (e) { console.error("WS Parse Error:", e); }
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
      const res = await privateApi.post("/api/sessions/create/", { initial_code: value, language });
      if (res.data.token) navigate(`/editor/${res.data.token}`);
    } catch (error) { toast({ title: "Failed", status: "error" }); }
  };

  const handleProblemChange = (newProblem) => {
    setProblem(newProblem);
    if (isCollaborating && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "problem_update", problem: newProblem }));
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
      wsRef.current.send(JSON.stringify({ type: "code_update", code: newValue }));
    }
  };

  const onSelect = (newLang) => {
    setLanguage(newLang); setValue(CODE_SNIPPETS[newLang] || "");
    if (isCollaborating && wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: "language_update", language: newLang }));
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
          {isCollaborating ? (
            <>
              <Button colorScheme="green" leftIcon={<FiUsers />} size={{ base: "sm", md: "md" }} isDisabled>Live Session</Button>
              <Tooltip label="Copy session link">
                <Button leftIcon={<FiLink2 />} colorScheme="blue" size={{ base: "sm", md: "md" }} variant="outline" onClick={() => navigator.clipboard.writeText(window.location.href)}>Copy Link</Button>
              </Tooltip>
            </>
          ) : (
            <Tooltip label="Start new collaboration session">
              <Button colorScheme="green" leftIcon={<FiUsers />} onClick={handleStartCollaboration} size={{ base: "sm", md: "md" }}>Start Collaboration</Button>
            </Tooltip>
          )}

          {/* --- AI BUTTON --- */}
          <Tooltip label="Ask AI to write code">
            <Button 
              leftIcon={<FiCpu />} 
              colorScheme="purple" 
              variant="solid" 
              size={{ base: "sm", md: "md" }}
              onClick={onAiOpen}
              isLoading={isAiLoading}
              loadingText="AI Thinking..."
            >
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
          <CodeforcesLoader onLoadSample={(input) => setStdin(input)} problem={problem} onProblemChange={handleProblemChange} />
          <Box bg="gray.900" p={4} borderRadius="md" border="1px solid" borderColor="gray.700">
            <Text fontWeight="bold" mb={2} color="gray.400">Input</Text>
            <Textarea value={stdin} onChange={(e) => setStdin(e.target.value)} placeholder="Enter custom input here..." minH="100px" bg="gray.800" border="none" color="white" resize="vertical" _focus={{ border: "1px solid", borderColor: "blue.500" }} />
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
              onKeyDown={(e) => { if(e.key === 'Enter') handleAiGenerate(); }}
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