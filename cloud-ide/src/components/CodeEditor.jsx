import React, { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Text,
  VStack,
  useToast,
  HStack,
  Select,
} from "@chakra-ui/react";
import { Editor } from "@monaco-editor/react";
import { CODE_SNIPPETS } from "../constants";
import {privateApi} from "./api"; 


const LanguageSelector = ({ language, onSelect }) => {
  const languages = Object.keys(CODE_SNIPPETS);
  return (
    <Select
      value={language}
      onChange={(e) => onSelect(e.target.value)}
      width="150px"
      bg="gray.700"
      color="white"
      borderColor="gray.600"
    >
      {languages.map((lang) => (
        <option key={lang} value={lang} style={{ color: 'black' }}>
          {lang.charAt(0).toUpperCase() + lang.slice(1)}
        </option>
      ))}
    </Select>
  );
};

const Output = ({ editorRef, language }) => {
  // A simple placeholder for the Output component
  // The original logic for 'executeCode' would go here
  return (
    <Box
      height="25vh"
      p={4}
      bg="gray.900"
      borderColor="gray.700"
      borderWidth={1}
      borderRadius="md"
    >
      <Text color="gray.400">Code output will appear here...</Text>
    </Box>
  );
};

const BASE_WS_URL = "ws://127.0.0.1:8000/ws/editor/";

const CodeEditor = () => {
  const { token: roomToken } = useParams(); 
  const editorRef = useRef();
  const wsRef = useRef(null);
  const [value, setValue] = useState("");
  const [language, setLanguage] = useState("cpp");

  const isCollaborating = !!roomToken;
  const toast = useToast();
  const navigate = useNavigate();

  const localUsernameRef = useRef(localStorage.getItem("username"));

  // --- WebSocket Setup ---
  useEffect(() => {
    if (!roomToken) return;

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
    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`Connected to session ${roomToken}`);
    };

    ws.onmessage = (event) => {
      // Check if event.data is a string before parsing
      if (typeof event.data === 'string') {
        try {
          const { data, user } = JSON.parse(event.data);

          // Handle messages
          switch (data.type) {
            case "code_update":
              setValue(data.code);
              break;
            case "language_update":
              setLanguage(data.language);
              break;
            case "cursor_update":
              console.log(`Cursor from ${user}:`, data.position);
              // Cursor rendering logic goes here
              break;
            case "full_state":
              setValue(data.code);
              setLanguage(data.language);
              break;
            default:
              console.warn("Unknown message type:", data.type);
          }
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      }
    };

    ws.onclose = (event) => {
      console.log("WebSocket closed", event.code);
      if (event.code === 4001 || event.code === 4002) {
        toast({
          title: "Auth Error",
          description: "Could not authenticate WebSocket. Please log in again.",
          status: "error",
        });
        navigate("/auth");
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket Error:", err);
    };

    return () => ws.close();
  }, [roomToken, toast, navigate]);

  // --- Create New Collaboration Session ---
  const handleStartCollaboration = async () => {
    try {
      
      const res = await privateApi.post("/api/sessions/create/", {
        initial_code: value,
        language: language,
      });

      if (res.data.token) {
        navigate(`/editor/${res.data.token}`);
      } else {
        throw new Error("Token not received.");
      }
    } catch (error) {
      console.error("Failed to start collaboration:", error);
      toast({
        title: "Failed to start collaboration",
        description: error.response?.data?.detail || error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // --- Editor Mount Logic ---
  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();

    editor.onDidChangeCursorPosition((e) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "cursor_update",
            position: e.position,
          })
        );
      }
    });

    if (!roomToken) {
      setValue(CODE_SNIPPETS[language] || "");
    }
  };

  const handleEditorChange = (newValue) => {
    setValue(newValue);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "code_update",
          code: newValue,
        })
      );
    }
  };

  const onSelect = (newLanguage) => {
    setLanguage(newLanguage);
    const newValue = CODE_SNIPPETS[newLanguage] || "";
    setValue(newValue);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "language_update",
          language: newLanguage,
        })
      );
    }
  };

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <HStack justifyContent="space-between">
          <LanguageSelector language={language} onSelect={onSelect} />
          {isCollaborating ? (
            <Text fontSize="sm" color="green.300">
              Session ID: <b>{roomToken}</b>
              <Button
                size="xs"
                ml={4}
                onClick={() =>
                  navigator.clipboard.writeText(window.location.href)
                }
              >
                Copy Link
              </Button>
            </Text>
          ) : (
            <Button colorScheme="green" onClick={handleStartCollaboration}>
              Start Collaboration
            </Button>
          )}
        </HStack>

        <Editor
          height="75vh"
          theme="vs-dark"
          language={language}
          value={value}
          onMount={onMount}
          onChange={handleEditorChange}
        />

        <Output editorRef={editorRef} language={language} />
      </VStack>
    </Box>
  );
};

export default CodeEditor;