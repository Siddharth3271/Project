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
import { useParams, useNavigate, Link } from "react-router-dom";
import { publicApi} from "./api";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Extract the secure tokens from the URL
  const { uidb64, token } = useParams();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        status: "error",
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      // Send the new password and tokens to the backend
      await publicApi.post("/api/auth/password-reset-complete/", {
        password: password,
        uidb64: uidb64,
        token: token,
      });
      
      setIsSuccess(true);
      toast({
        title: "Password Reset Successful",
        description: "You can now log in with your new password.",
        status: "success",
        duration: 5000,
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => navigate("/auth"), 3000);
      
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: error.response?.data?.error || "The reset link may be invalid or expired.",
        status: "error",
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bgGradient="linear(to-br, #0a192f, #172a45)">
      <Box bg="white" p={8} borderRadius="lg" boxShadow="xl" w="full" maxW="md">
        <VStack spacing={6}>
          <Heading size="lg" color="blue.600">Set New Password</Heading>
          
          {isSuccess ? (
            <VStack spacing={4}>
              <Text textAlign="center" color="green.600" fontWeight="medium">
                Your password has been reset successfully!
              </Text>
              <Button as={Link} to="/auth" colorScheme="blue" w="full">
                Go to Login
              </Button>
            </VStack>
          ) : (
            <form onSubmit={handleSubmit} style={{ width: "100%" }}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel color="gray.700">New Password</FormLabel>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    bg="gray.50"
                    color="black"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel color="gray.700">Confirm Password</FormLabel>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
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
                  Reset Password
                </Button>
              </VStack>
            </form>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default ResetPassword;