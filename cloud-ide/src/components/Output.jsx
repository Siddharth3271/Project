import React, { useState, useImperativeHandle, forwardRef } from "react";
import { Box, Text, useToast, HStack, Spinner, IconButton } from "@chakra-ui/react";
import { FiTrash2 } from "react-icons/fi";
import { executeCode } from "./api";

const Output=forwardRef(({ editorRef, language }, ref) => {
  const toast = useToast();
  const [output, setOutput] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [stdin,setStdin]=useState("");

  // Expose runCode() to parent (CodeEditor)
  useImperativeHandle(ref, ()=>({
    runCode,
    isLoading,
  }));

  const runCode = async()=>{
    if(!editorRef.current){
      toast({
        title: "Editor not ready",
        status: "error",
      });
      return;
    }
    const sourceCode = editorRef.current.getValue();
    if (!sourceCode.trim()) {
      toast({
        title: "Empty code!",
        description: "Please write some code before running.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    try{
      setIsLoading(true);
      setOutput(null);
      const { run: result }=await executeCode(language, sourceCode, stdin);

      const combinedOutput=(result.output || result.stdout || "").split("\n");
      setOutput(combinedOutput);
      setIsError(!!result.stderr);
    } 
    catch (error){
      console.error(error);
      toast({
        title: "Execution Failed",
        description: error.message || "Unable to run your code.",
        status: "error",
        duration: 4000,
      });
    } 
    finally{
      setIsLoading(false);
    }
  };

  const clearOutput=()=>setOutput(null);

  return(
    
    <Box
      bg="rgba(17, 25, 40, 0.8)"
      backdropFilter="blur(10px)"
      border="1px solid"
      borderColor="gray.700"
      borderRadius="lg"
      p={4}
      mt={2}
      minH="30vh"
      boxShadow="0 0 25px rgba(0,0,0,0.3)"
      overflowY="auto"
    >
      <Box mb={4}>
      <Text fontSize="sm" mb={1} color="gray.400">
        Program Input (STDIN)
      </Text>
      <textarea
        value={stdin}
        onChange={(e) => setStdin(e.target.value)}
        placeholder={`Enter input for your program here...`}
        style={{
          width: "100%",
          height: "100px",
          background: "#0f172a",
          color: "white",
          border: "1px solid #334155",
          borderRadius: "6px",
          padding: "8px",
          fontFamily: "monospace",
          fontSize: "14px",
        }}
      />
      </Box>

      <HStack justify="space-between" mb={3}>
        <HStack spacing={2}>
          {isLoading && (
            <HStack>
              <Spinner size="sm" color="blue.400" />
              <Text fontSize="sm" color="gray.400">
                Running...
              </Text>
            </HStack>
          )}
          {output && (
            <IconButton
              aria-label="Clear Output"
              icon={<FiTrash2 />}
              size="sm"
              colorScheme="red"
              variant="ghost"
              onClick={clearOutput}
            />
          )}
        </HStack>
      </HStack>

      <Box
        fontFamily="monospace"
        fontSize="sm"
        whiteSpace="pre-wrap"
        color={isError ? "red.400" : "green.300"}
      >
        {output ? (
          output.map((line, i) => (
            <Text key={i} color={isError ? "red.400" : "green.300"}>
              {line || " "}
            </Text>
          ))
        ) : (
          <Text color="gray.500" fontStyle="italic">
            Click ▶ Run to execute your code...
          </Text>
        )}
      </Box>
    </Box>
  );
});

export default Output;
