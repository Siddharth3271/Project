import { Box, Button, Text, Heading, VStack } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Chakra + Framer Motion combo
const MotionBox = motion(Box);

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <Box
      position="relative"
      minH="100vh"
      overflow="hidden"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgGradient="linear(to-r, #0f0a19, #1a1029)"
      color="white"
      textAlign="center"
    >
      {/* Animated red glowing circle */}
      <MotionBox
        position="absolute"
        w="400px"
        h="400px"
        borderRadius="50%"
        bg="red.400"
        filter="blur(120px)"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        animate={{
          opacity: [0.2, 0.5, 0.2],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main content */}
      <VStack spacing={6} zIndex={1}>
        <Text fontSize="xl" color="gray.400">
          Hello, Welcome to
        </Text>
        <Heading size="4xl" bgGradient="linear(to-r, red.400, pink.400)" bgClip="text">
          Cloud IDE
        </Heading>
        <Text maxW="lg" color="gray.300" fontSize="lg">
          Build, run, and share your code in the cloud — fast, secure, and collaborative.
        </Text>

        <Box display="flex" gap={4}>
          <Button
            size="lg"
            bg="red.500"
            _hover={{ bg: "red.600" }}
            onClick={() => navigate("/editor/new")}
          >
            Start Coding
          </Button>
          <Button
            size="lg"
            variant="outline"
            colorScheme="red"
            onClick={() => navigate("/editor/demo")}
          >
            Try Demo
          </Button>
          <Button colorScheme="blue" size="lg"onClick={() => navigate("/auth")}>
            Get Started
          </Button>
        </Box>
      </VStack>
    </Box>
  );
}
