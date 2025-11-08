import React, { useState } from "react";
import {
  Box,
  Button,
  Input,
  Text,
  VStack,
  HStack,
  Link,
  useToast,
  Heading,
  FormControl,
  FormLabel,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";
// We don't need axios here anymore
import { useNavigate } from "react-router-dom";
// --- FIX: Import both loginUser and signupUser ---
import { loginUser, signupUser } from "../api";

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const toast = useToast();
  const navigate = useNavigate();

  // We don't need API_BASE anymore
  // const API_BASE = "http://127.0.0.1:8000/api/auth";

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLogin) {
        // This part was already correct
        await loginUser({ username, password });

        toast({
          title: "Login Successful",
          description: "Welcome back!",
          status: "success",
          duration: 2000,
          isClosable: true,
        });

        setTimeout(() => navigate("/editor/new"), 1000);
      } else {
        // 🔹 SIGNUP
        if (password !== confirmPassword) {
          toast({
            title: "Passwords do not match!",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        // --- FIX: Use the signupUser function from api.js ---
        await signupUser({
          username,
          email,
          password,
        });

        toast({
          title: "Account Created",
          description: "You can now log in",
          status: "success",
          duration: 2000,
          isClosable: true,
        });

        setIsLogin(true);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description:
          error.response?.data?.error || "Something went wrong!",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      bg="#0C67A0"
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      fontFamily="sans-serif"
      p={4}
    >
      <Box
        bg="white"
        p={8}
        rounded="2xl"
        shadow="2xl"
        width={{ base: "90%", sm: "400px" }}
        color="black"
      >
        <HStack spacing={0} mb={6}>
          <Button
            flex="1"
            borderRadius="md"
            bg={isLogin ? "blue.700" : "gray.200"}
            color={isLogin ? "white" : "black"}
            _hover={{ bg: isLogin ? "blue.800" : "gray.300" }}
            onClick={() => setIsLogin(true)}
          >
            Log In
          </Button>
          <Button
            flex="1"
            borderRadius="md"
            bg={!isLogin ? "blue.700" : "gray.200"}
            color={!isLogin ? "white" : "black"}
            _hover={{ bg: !isLogin ? "blue.800" : "gray.300" }}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </Button>
        </HStack>

        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch">
            <Heading size="md" textAlign="center" color="gray.700">
              {isLogin ? "Welcome Back" : "Create Account"}
            </Heading>

            {/* Username Field */}
            <FormControl>
              <FormLabel color="gray.700">Username</FormLabel>
              <Input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                bg="gray.50"
                color="black"
                _placeholder={{ color: "gray.500" }}
              />
            </FormControl>

            {/* Email only for signup */}
            {!isLogin && (
              <FormControl>
                <FormLabel color="gray.700">Email</FormLabel>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  bg="gray.50"
                  color="black"
                  _placeholder={{ color: "gray.500" }}
                />
              </FormControl>
            )}

            {/* Password */}
            <FormControl>
              <FormLabel color="gray.700">Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  bg="gray.50"
                  color="black"
                  _placeholder={{ color: "gray.500" }}
                />
                <InputRightElement width="4.5rem">
                  <Button
                    h="1.75rem"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>

            {/* Confirm password only for signup */}
            {!isLogin && (
              <FormControl>
                <FormLabel color="gray.700">Confirm Password</FormLabel>
                <Input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  bg="gray.50"
                  color="black"
                  _placeholder={{ color: "gray.500" }}
                />
              </FormControl>
            )}

            {isLogin && (
              <Link href="#" color="blue.600" fontSize="sm" alignSelf="flex-end">
                Forgot Password?
              </Link>
            )}

            <Button
              type="submit"
              colorScheme="blue"
              w="full"
              mt={2}
              bg="blue.700"
              _hover={{ bg: "blue.800" }}
            >
              {isLogin ? "Log In" : "Sign Up"}
            </Button>

            <Text fontSize="sm" textAlign="center" color="gray.600">
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
              <Link
                color="blue.600"
                onClick={() => setIsLogin(!isLogin)}
                fontWeight="bold"
              >
                {isLogin ? "Sign Up" : "Log In"}
              </Link>
            </Text>
          </VStack>
        </form>
      </Box>
    </Box>
  );
};

export default AuthForm;

