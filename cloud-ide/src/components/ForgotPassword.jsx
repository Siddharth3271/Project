import React, { useState } from "react";
import {
  Box,
  Button,
  Input,
  Text,
  VStack,
  useToast,
  Heading,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { publicApi } from "./api"; 

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await publicApi.post("/api/auth/request-reset-email/", { email });
      
      setIsSent(true);
      toast({
        title: "Reset Link Sent",
        description: "If an account with that email exists, we sent a password reset link.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again later.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bgGradient="linear(to-br, #0a192f, #172a45)">
      <Box bg="white" p={8} borderRadius="lg" boxShadow="xl" w="full" maxW="md">
        <VStack spacing={6}>
          <Heading size="lg" color="blue.600">Forgot Password</Heading>
          
          {isSent ? (
            <VStack spacing={4}>
              <Text textAlign="center" color="green.600" fontWeight="medium">
                Check your email for the reset link!
              </Text>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                (For development, check your Django console terminal to see the printed email containing the link).
              </Text>
              <Button as={Link} to="/auth" colorScheme="blue" variant="outline" w="full">
                Back to Login
              </Button>
            </VStack>
          ) : (
            <form onSubmit={handleSubmit} style={{ width: "100%" }}>
              <VStack spacing={4}>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Enter your registered email address and we'll send you a link to reset your password.
                </Text>
                
                <FormControl isRequired>
                  <FormLabel color="gray.700">Email Address</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    bg="gray.50"
                    color="black"
                  />
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  w="full"
                  isLoading={isLoading}
                >
                  Send Reset Link
                </Button>

                <Button as={Link} to="/auth" variant="ghost" colorScheme="blue" size="sm">
                  Back to Login
                </Button>
              </VStack>
            </form>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default ForgotPassword;