import { Box, Button, Text, Heading, VStack, HStack, Icon, Flex, SimpleGrid } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiCode, FiCloud, FiUsers, FiZap, FiShare2, FiDatabase } from "react-icons/fi";

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
      flexDir="column"
      bgGradient="linear(to-br, #0b0a12, #1a1029, #23163a)"
      color="white"
      px={{ base: 4, md: 10 }}
      textAlign="center"
    >
      {/* Subtle animated glowing circles */}
      <MotionBox
        position="absolute"
        w={{ base: "300px", md: "500px" }}
        h={{ base: "300px", md: "500px" }}
        borderRadius="50%"
        bg="red.400"
        filter="blur(150px)"
        top={{ base: "35%", md: "40%" }}
        left={{ base: "50%", md: "60%" }}
        animate={{ opacity: [0.15, 0.35, 0.15], scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <MotionBox
        position="absolute"
        w={{ base: "200px", md: "350px" }}
        h={{ base: "200px", md: "350px" }}
        borderRadius="50%"
        bg="blue.400"
        filter="blur(120px)"
        bottom={{ base: "20%", md: "30%" }}
        right={{ base: "60%", md: "70%" }}
        animate={{ opacity: [0.1, 0.25, 0.1], scale: [1, 1.05, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Header Text */}
      <VStack spacing={{ base: 4, md: 5 }} zIndex={1} mt={{ base: 16, md: 0 }}>
        <Text fontSize={{ base: "lg", md: "xl" }} color="gray.400" fontWeight="medium">
          Welcome to
        </Text>
        <Heading
          size={{ base: "2xl", md: "4xl" }}
          bgGradient="linear(to-r, red.400, pink.300, purple.400)"
          bgClip="text"
          letterSpacing="tight"
          fontWeight="extrabold"
        >
          Collaborative IDE
        </Heading>

        <Text
          maxW="2xl"
          color="gray.300"
          fontSize={{ base: "sm", md: "md", lg: "lg" }}
          lineHeight="1.8"
        >
          - Code Together in Real-Time from Anywhere -
        </Text>

        {/* Feature highlights */}
        <HStack spacing={{ base: 4, md: 8 }} justify="center" mt={6} flexWrap="wrap">
          <VStack spacing={2} _hover={{ transform: "scale(1.05)", transition: "0.3s" }}>
            <Icon as={FiCode} boxSize={{ base: 5, md: 6 }} color="red.400" />
            <Text color="gray.300" fontSize={{ base: "xs", md: "sm" }}>Multi-language Support</Text>
          </VStack>
          <VStack spacing={2} _hover={{ transform: "scale(1.05)", transition: "0.3s" }}>
            <Icon as={FiCloud} boxSize={{ base: 5, md: 6 }} color="blue.400" />
            <Text color="gray.300" fontSize={{ base: "xs", md: "sm" }}>Cloud Execution</Text>
          </VStack>
          <VStack spacing={2} _hover={{ transform: "scale(1.05)", transition: "0.3s" }}>
            <Icon as={FiUsers} boxSize={{ base: 5, md: 6 }} color="pink.400" />
            <Text color="gray.300" fontSize={{ base: "xs", md: "sm" }}>Team Collaboration</Text>
          </VStack>
        </HStack>

        {/* IDE Capabilities Grid */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{ base: 4, md: 6 }} mt={10}>
          <MotionBox
            p={{ base: 4, md: 6 }}
            bg="rgba(255,255,255,0.05)"
            borderRadius="xl"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <Icon as={FiZap} boxSize={{ base: 6, md: 8 }} color="red.400" mb={3} />
            <Text fontWeight="bold" fontSize={{ base: "md", md: "lg" }}>Fast Execution</Text>
            <Text fontSize={{ base: "xs", md: "sm" }} color="gray.300">Run your code instantly in the cloud without waiting.</Text>
          </MotionBox>

          <MotionBox
            p={{ base: 4, md: 6 }}
            bg="rgba(255,255,255,0.05)"
            borderRadius="xl"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <Icon as={FiShare2} boxSize={{ base: 6, md: 8 }} color="blue.400" mb={3} />
            <Text fontWeight="bold" fontSize={{ base: "md", md: "lg" }}>Code Together</Text>
            <Text fontSize={{ base: "xs", md: "sm" }} color="gray.300">Collaborate with teammates seamlessly in real-time.</Text>
          </MotionBox>

          <MotionBox
            p={{ base: 4, md: 6 }}
            bg="rgba(255,255,255,0.05)"
            borderRadius="xl"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <Icon as={FiDatabase} boxSize={{ base: 6, md: 8 }} color="pink.400" mb={3} />
            <Text fontWeight="bold" fontSize={{ base: "md", md: "lg" }}>Synchronization</Text>
            <Text fontSize={{ base: "xs", md: "sm" }} color="gray.300">Work together in real-time, edit, and run code instantly from anywhere.</Text>
          </MotionBox>
        </SimpleGrid>

        {/* Buttons */}
        <HStack spacing={{ base: 3, md: 5 }} mt={10} flexWrap="wrap">
          <MotionBox whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
            <Button
              size={{ base: "md", md: "lg" }}
              bgGradient="linear(to-r, red.500, pink.500)"
              _hover={{ bgGradient: "linear(to-r, red.600, pink.600)" }}
              onClick={() => navigate("/editor/new")}
            >
              Start Coding
            </Button>
          </MotionBox>
          <MotionBox whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
            <Button
              size={{ base: "md", md: "lg" }}
              variant="outline"
              borderColor="red.400"
              color="red.300"
              _hover={{ bg: "rgba(255, 255, 255, 0.05)", borderColor: "red.500" }}
              onClick={() => navigate("/editor/demo")}
            >
              Try Demo
            </Button>
          </MotionBox>
          <MotionBox whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
            <Button
              size={{ base: "md", md: "lg" }}
              colorScheme="blue"
              bgGradient="linear(to-r, blue.500, cyan.400)"
              _hover={{ bgGradient: "linear(to-r, blue.600, cyan.500)" }}
              onClick={() => navigate("/auth")}
            >
              Get Started
            </Button>
          </MotionBox>
        </HStack>

        {/* Footer Text */}
        <Text color="gray.500" fontSize={{ base: "xs", md: "sm" }} mt={10}>
          Empowering developers to code from anywhere — securely in the cloud.
        </Text>
      </VStack>
    </Box>
  );
}
