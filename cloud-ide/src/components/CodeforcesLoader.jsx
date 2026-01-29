import React, { useState } from "react";
import {
  Box,
  Button,
  Input,
  Text,
  VStack,
  HStack,
  Select,
  useToast,
  Spinner,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";
import { privateApi } from "./api";

const CodeforcesLoader = ({ onLoadSample }) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState(null);
  const [selectedSample, setSelectedSample] = useState(0);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const fetchProblem = async () => {
    const parsed = parseCodeforcesUrl(url);

    if (!parsed) {
      toast({
        title: "Invalid Codeforces URL",
        status: "error",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await privateApi.post("/api/codeforces/fetch/", {
        contest_id: parsed.contest_id,
        problem_index: parsed.problem_index,
      });

      const problemData = res.data;
      setProblem(problemData);
      
      // --- FIX 1: Auto-load the first sample immediately ---
      setSelectedSample(0);
      if (problemData.samples && problemData.samples.length > 0) {
        onLoadSample(problemData.samples[0].input);
      }

      toast({
        title: "Problem Fetched",
        status: "success",
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: "Failed to fetch problem",
        description: err.response?.data?.error || err.message,
        status: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  function parseCodeforcesUrl(url) {
    try {
      let match = url.match(/problemset\/problem\/(\d+)\/([A-Z0-9]+)/i);
      if (match) return { contest_id: match[1], problem_index: match[2] };
      match = url.match(/contest\/(\d+)\/problem\/([A-Z0-9]+)/i);
      if (match) return { contest_id: match[1], problem_index: match[2] };
      return null;
    } catch {
      return null;
    }
  }

  // --- FIX 2: Handle Dropdown Change ---
  const handleSampleChange = (e) => {
    const newIndex = Number(e.target.value);
    setSelectedSample(newIndex);
    
    // Auto-load the input for the selected sample
    if (problem?.samples?.[newIndex]) {
      onLoadSample(problem.samples[newIndex].input);
    }
  };

  const handleLoadSample = () => {
    if (!problem?.samples?.length) return;
    onLoadSample(problem.samples[selectedSample].input);
    toast({ title: "Input Loaded", status: "info", duration: 1000 });
  };

  return (
    <Box
      bg="rgba(255,255,255,0.04)"
      border="1px solid"
      borderColor="gray.700"
      borderRadius="lg"
      p={4}
      mb={4}
    >
      <VStack align="stretch" spacing={3}>
        <Text fontWeight="bold" color="blue.300">
          Load Codeforces Problem
        </Text>

        <HStack>
          <Input
            placeholder="https://codeforces.com/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            bg="gray.900"
            borderColor="gray.600"
            color="white"
            size="sm"
          />
          <Button
            colorScheme="blue"
            onClick={fetchProblem}
            isLoading={loading}
            size="sm"
          >
            Fetch
          </Button>
        </HStack>

        {problem && (
          <>
            <HStack justify="space-between">
              <Text fontSize="sm" fontWeight="bold" color="white" noOfLines={1}>
                {problem.title}
              </Text>
              <Button size="xs" variant="outline" colorScheme="orange" onClick={onOpen}>
                Read Statement
              </Button>
            </HStack>

            <HStack>
              <Select
                value={selectedSample}
                onChange={handleSampleChange} // Use our new handler
                bg="gray.900"
                color="white"
                borderColor="gray.600"
                size="sm"
                sx={{
                  option: { backgroundColor: "#171923", color: "white" },
                }}
              >
                {problem.samples?.map((_, idx) => (
                  <option key={idx} value={idx}>
                    Sample #{idx + 1}
                  </option>
                ))}
              </Select>

              {/* Kept button as a manual override if needed */}
              <Button colorScheme="green" onClick={handleLoadSample} size="sm">
                Load Input
              </Button>
            </HStack>

            <Box>
              <Text fontSize="xs" color="gray.400" mb={1}>
                Expected Output:
              </Text>
              <Textarea
                value={problem.samples[selectedSample].output}
                readOnly
                bg="gray.800"
                border="none"
                color="green.300"
                fontSize="sm"
                resize="none"
                h="80px"
              />
            </Box>

            {/* Problem Statement Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
              <ModalOverlay backdropFilter="blur(5px)" />
              <ModalContent bg="gray.800" color="white" border="1px solid" borderColor="gray.700" maxWidth="800px">
                <ModalHeader borderBottom="1px solid" borderColor="gray.700">
                  {problem.title}
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6} pt={4}>
                  <Box 
                    className="problem-statement-html"
                    dangerouslySetInnerHTML={{ __html: problem.statement }}
                    sx={{
                      "p": { marginBottom: "1em", lineHeight: "1.6" },
                      "ul": { marginLeft: "20px", marginBottom: "1em" },
                      "li": { marginBottom: "0.5em" },
                      "pre": { 
                        bg: "gray.900", 
                        p: 2, 
                        borderRadius: "md", 
                        overflowX: "auto",
                        fontFamily: "monospace",
                        marginBottom: "1em"
                      },
                      "img": {
                        maxWidth: "100%",
                        height: "auto",
                        display: "block",
                        margin: "1rem auto",
                        borderRadius: "4px",
                        border: "1px solid #4A5568"
                      },
                      ".section-title": {
                        fontWeight: "bold",
                        fontSize: "lg",
                        color: "blue.300",
                        marginTop: "1.5rem",
                        marginBottom: "0.5rem"
                      }
                    }}
                  />
                </ModalBody>
              </ModalContent>
            </Modal>
          </>
        )}

        {loading && (
          <HStack justify="center">
            <Spinner size="sm" color="blue.300" />
            <Text fontSize="xs" color="gray.400">Parsing problem...</Text>
          </HStack>
        )}
      </VStack>
    </Box>
  );
};

export default CodeforcesLoader;