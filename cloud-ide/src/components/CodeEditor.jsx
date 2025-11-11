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
  Badge,
} from "@chakra-ui/react";
import { Editor } from "@monaco-editor/react";
import { CODE_SNIPPETS } from "../constants";
import { privateApi } from "./api";
import { FiCopy, FiPlay, FiUsers, FiLink2 } from "react-icons/fi";
import Output from "./Output";



const LanguageSelector = ({ language, onSelect }) => {
  const languageLabels = {
    cpp: "C++",
    python: "Python",
    java: "Java",
  };
  const languages = Object.keys(languageLabels);

  return (
    <Select
      value={language}
      onChange={(e) => onSelect(e.target.value)}
      bg="gray.800"
      color="white"
      borderColor="gray.600"
      width={{ base: "120px", sm: "140px", md: "160px" }}
      _hover={{ borderColor: "blue.400" }}
      _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
      sx={{
        option: {
          backgroundColor: "#1A202C",
          color: "white",
        },
        "option:hover": {
          backgroundColor: "#2D3748",
        },
      }}
    >
      {languages.map((lang) => (
        <option key={lang} value={lang}>
          {languageLabels[lang]}
        </option>
      ))}
    </Select>
  );
};

const BASE_WS_URL = "ws://127.0.0.1:8000/ws/editor/";

const CodeEditor = () => {
  const { token: roomToken } = useParams();
  const editorRef = useRef();
  const outputRef = useRef();
  const wsRef = useRef(null);
  const [value, setValue] = useState("");
  const [language, setLanguage] = useState("cpp");
  const isCollaborating = !!roomToken && roomToken !== "new";
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isCollaborating) return;

    const accessToken = localStorage.getItem("access");
    if (!accessToken) {
      toast({
        title: "Authentication Required",
        description: "Please log in to join collaboration.",
        status: "error",
      });
      return;
    }

    const WS_URL = `${BASE_WS_URL}${roomToken}/?token=${accessToken}`;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => console.log(`Connected to session ${roomToken}`);
    ws.onmessage = (event) => {
      if (typeof event.data === "string") {
        try {
          const { data, user } = JSON.parse(event.data);
          switch (data.type) {
            case "code_update":
              setValue(data.code);
              break;
            case "language_update":
              setLanguage(data.language);
              break;
            case "full_state":
              setValue(data.code);
              setLanguage(data.language);
              break;
            default:
              console.warn("Unknown message type:", data.type);
          }
        } catch (e) {
          console.error("Failed to parse message:", e);
        }
      }
    };
    ws.onclose = (e) => console.log("WebSocket closed:", e.code);
    ws.onerror = (e) => console.error("WebSocket Error:", e);

    return () => ws.close();
  }, [roomToken, toast, navigate, isCollaborating]);

  const handleStartCollaboration = async () => {
    try {
      const res = await privateApi.post("/api/sessions/create/", {
        initial_code: value,
        language,
      });
      if (res.data.token) navigate(`/editor/${res.data.token}`);
    } catch (error) {
      toast({
        title: "Failed to start collaboration",
        description: error.response?.data?.detail || error.message,
        status: "error",
      });
    }
  };

  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
    if (!isCollaborating) {
      setValue(CODE_SNIPPETS[language] || "");
    }
  };

  const handleEditorChange = (newValue) => {
    setValue(newValue);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "code_update", code: newValue }));
    }
  };

  const onSelect = (newLang) => {
    setLanguage(newLang);
    setValue(CODE_SNIPPETS[newLang] || "");
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "language_update", language: newLang }));
    }
  };

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-br, #0a192f, #172a45)"
      color="white"
      p={{ base: 3, md: 6 }}
    >
      {/* Top Toolbar */}
      <Flex
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "stretch", md: "center" }}
        bg="rgba(255,255,255,0.05)"
        backdropFilter="blur(10px)"
        p={{ base: 3, md: 4 }}
        borderRadius="xl"
        boxShadow="0 4px 20px rgba(0,0,0,0.2)"
        mb={4}
        wrap="wrap"
        gap={3}
      >
        <HStack spacing={4} flexWrap="wrap">
          <Text fontWeight="extrabold" fontSize={{ base: "md", md: "lg" }} color="blue.300">
            Cloud IDE
          </Text>
          <Divider orientation="vertical" borderColor="gray.600" display={{ base: "none", md: "block" }} />
          <LanguageSelector language={language} onSelect={onSelect} />
        </HStack>

        <HStack spacing={3} flexWrap="wrap" mt={{ base: 2, md: 0 }}>
          {isCollaborating ? (
            <>
              <Button
                colorScheme="green"
                leftIcon={<FiUsers />}
                size={{ base: "sm", md: "md" }}
                variant="solid"
                isDisabled
              >
                Live Session
              </Button>
              <Tooltip label="Copy session link">
                <Button
                  leftIcon={<FiLink2 />}
                  colorScheme="blue"
                  size={{ base: "sm", md: "md" }}
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                >
                  Copy Link
                </Button>
              </Tooltip>
            </>
          ) : (
            <Tooltip label="Start new collaboration session">
              <Button
                colorScheme="green"
                leftIcon={<FiUsers />}
                onClick={handleStartCollaboration}
                size={{ base: "sm", md: "md" }}
              >
                Start Collaboration
              </Button>
            </Tooltip>
          )}
          <Tooltip label="Run code">
            <IconButton
              icon={<FiPlay />}
              colorScheme="blue"
              variant="solid"
              size="sm"
              onClick={() => outputRef.current?.runCode()}
              isLoading={outputRef.current?.isLoading} 
            />
          </Tooltip>
        </HStack>
      </Flex>

      {/* Editor */}
      <Box
        border="1px solid"
        borderColor="gray.700"
        borderRadius="md"
        overflow="hidden"
        boxShadow="0 0 25px rgba(0,0,0,0.3)"
        h={{ base: "60vh", md: "70vh" }}
      >
        <Editor
          height="100%"
          theme="vs-dark"
          language={language}
          value={value}
          onMount={onMount}
          onChange={handleEditorChange}
          options={{
            fontSize: 15,
            minimap: { enabled: false },
            smoothScrolling: true,
            padding: { top: 12 },
            cursorBlinking: "phase",
          }}
        />
      </Box>

      {/* Output Panel */}
      <Box mt={6}>
        <Text fontWeight="extrabold" mb={2} color="gray.300" fontSize={{ base: "sm", md: "md" }}>
          Output Console
        </Text>
        <Output editorRef={editorRef} language={language} ref={outputRef}/>
      </Box>
    </Box>
  );
};

export default CodeEditor;
