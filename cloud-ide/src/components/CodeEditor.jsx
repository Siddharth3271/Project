import { useRef, useState, useEffect } from "react";
import { useParams } from 'react-router-dom'; // <-- New Import
import { Box, Button, Text, VStack, useToast, HStack } from "@chakra-ui/react"; // <-- Button, Text, useToast
import { Editor } from "@monaco-editor/react";
import LanguageSelector from "./LanguageSelector";
import { CODE_SNIPPETS } from "../constants";
import Output from "./Output";

// --- Configuration ---
const BASE_WS_URL = 'ws://127.0.0.1:8000/ws/editor/';
const BASE_HTTP_URL = 'http://127.0.0.1:8000/';
// ---------------------

const CodeEditor = () => {
    // 1. Read the token from the URL
    const { token } = useParams(); // 'token' will be undefined if no parameter is present
    
    const editorRef = useRef();
    const wsRef = useRef(null);
    const [value, setValue] = useState("");
    const [language, setLanguage] = useState("cpp");
    const isCollaborating = !!token // true if token exists
    const toast = useToast();

    // 2. WebSocket Setup Effect - Runs only when 'token' changes
    useEffect(() => {
        // Only attempt to connect if a token is present
        if (!token) {
            console.log("No token present. Collaboration feature not active.");
            return;
        }
        
        // Construct the dynamic URL
        const WS_URL = `${BASE_WS_URL}${token}/`;
        
        if (wsRef.current) wsRef.current.close();

        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log(`WebSocket connected to session: ${token}`);
            toast({
                title: "Collaboration Active",
                description: `You've joined session ${token}.`,
                status: "success",
                duration: 1500,
                isClosable: true,
            });
            ws.send(JSON.stringify({ type: "request_full_state" }));
        };

        // ... (ws.onmessage, ws.onclose, ws.onerror remains the same as before) ...

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "code_update") {
                setValue(data.code); 
            } else if (data.type === "language_update") {
                setLanguage(data.language);
            } else if (data.type === "full_state") {
                setValue(data.code);
                setLanguage(data.language);
            }
        };

        return () => {
            ws.close();
        };
    }, [token]); // <-- Dependency on 'token'

    // 3. Handler to Generate a New Token (Start Collaboration)
    const handleStartCollaboration = async () => {
        try {
            const response = await fetch(`${BASE_HTTP_URL}api/sessions/create/`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    // You'll need to handle CSRF tokens if Django requires it!
                },
                body: JSON.stringify({ 
                    initial_code: value, 
                    language: language 
                }) 
            });

            const data = await response.json();
            
            if (data.token) {
                // Redirect the user to the new collaborative URL
                window.location.href = `/editor/${data.token}`;
            } else {
                 throw new Error("Token not received.");
            }
        } catch (error) {
            console.error("Failed to start collaboration session:", error);
            toast({
                title: "Error",
                description: "Could not create collaboration session.",
                status: "error",
            });
        }
    };
    
    // ... (onMount, onSelect, handleEditorChange remain the same, 
    //      but make sure handleEditorChange uses 'token' for its WS message if needed) ...

    const onMount = (editor) => {
        editorRef.current = editor;
        editor.focus();
        if (!token) {
            // Set initial snippet only if we are starting fresh, not joining
            setValue(CODE_SNIPPETS[language] || ""); 
        }
    };

    const handleEditorChange = (newValue) => {
        setValue(newValue);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: "code_update",
                code: newValue,
                // The token is implicit in the connection, but you could send it here
            }));
        }
    };

    const onSelect = (newLanguage) => {
        setLanguage(newLanguage);
        const newValue = CODE_SNIPPETS[newLanguage] || "";
        setValue(newValue);

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: "language_update",
                language: newLanguage
            }));
        }
    }

    return (
        <Box>
            <VStack spacing={4} align="stretch">
                <HStack justifyContent="space-between">
                    <LanguageSelector language={language} onSelect={onSelect} />
                    
                    {/* 4. Display the Collaboration UI */}
                    {isCollaborating ? (
                         <Text fontSize="sm" color="green.300">
                             Session ID: <Text as="span" fontWeight="bold">{token}</Text>
                             <Button size="xs" ml={4} onClick={() => navigator.clipboard.writeText(window.location.href)}>
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