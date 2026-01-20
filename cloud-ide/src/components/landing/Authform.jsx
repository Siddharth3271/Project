import React, { useState } from "react";
import {Box,Button,Input,Text,VStack,HStack,Link,useToast,Heading,FormControl,FormLabel,InputGroup,InputRightElement} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { loginUser, signupUser } from "../api";

const AuthForm = () => {
  const [isLogin,setIsLogin]=useState(true);
  const [showPassword,setShowPassword]=useState(false);
  const [email,setEmail]=useState("");
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [confirmPassword,setConfirmPassword]=useState("");
  const toast=useToast();
  const navigate=useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try{
      if (isLogin){
        await loginUser({username, password});
        toast({
          title: "Login Successful",
          description: "Welcome back!",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        setTimeout(() => navigate("/editor/new"), 1000);
      } 
      else{
        if(password!==confirmPassword){
          toast({
            title: "Passwords do not match!",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          return;
        }
        await signupUser({ username, email, password });
        toast({
          title: "Account Created",
          description: "You can now log in",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        setIsLogin(true);
      }
    } 
    catch(error){
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
      bgGradient="linear(to-br, #0077c2, #0099ff)"
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <Box
        bg="rgba(255, 255, 255, 0.85)"
        backdropFilter="blur(12px)"
        p={10}
        rounded="2xl"
        boxShadow="0 8px 30px rgba(0, 0, 0, 0.2)"
        border="1px solid rgba(255,255,255,0.4)"
        width={{ base: "90%", sm: "400px" }}
        animation="fadeIn 0.8s ease-in-out"
        sx={{
          "@keyframes fadeIn": {
            from: { opacity: 0, transform: "translateY(10px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          },
        }}
      >
        <HStack spacing={0} mb={8}>
          <Button
            flex="1"
            borderRadius="md"
            bg={isLogin ? "blue.700" : "gray.200"}
            color={isLogin ? "white" : "black"}
            _hover={{
              transform: "scale(1.05)",
              bg: isLogin ? "blue.800" : "gray.300",
              transition: "0.2s ease-in-out",
            }}
            onClick={() => setIsLogin(true)}
          >
            Log In
          </Button>
          <Button flex="1" borderRadius="md" bg={!isLogin ? "blue.700" : "gray.200"} color={!isLogin ? "white" : "black"}
            _hover={{
              transform: "scale(1.05)",
              bg: !isLogin ? "blue.800" : "gray.300",
              transition: "0.2s ease-in-out",
            }}
            onClick={() => setIsLogin(false)}>
            Sign Up
          </Button>
        </HStack>

        <form onSubmit={handleSubmit}>
          <VStack spacing={5} align="stretch">
            <Heading
              size="lg"
              textAlign="center"
              color="gray.800"
              fontWeight="extrabold"
              letterSpacing="wide"
            >
              {isLogin ? "Welcome Back" : "Create Account"}
            </Heading>

            <FormControl>
              <FormLabel color="gray.700">Username</FormLabel>
              <Input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                bg="whiteAlpha.800"
                _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
              />
            </FormControl>

            {!isLogin && (
              <FormControl>
                <FormLabel color="gray.700">Email</FormLabel>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  bg="whiteAlpha.800"
                  _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                />
              </FormControl>
            )}

            <FormControl>
              <FormLabel color="gray.700">Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  bg="whiteAlpha.800"
                  _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                />
                <InputRightElement width="4.5rem">
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="blue"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>

            {!isLogin && (
              <FormControl>
                <FormLabel color="gray.700">Confirm Password</FormLabel>
                <Input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  bg="whiteAlpha.800"
                  _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
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
              fontWeight="bold"
              transition="all 0.2s ease-in-out"
              _hover={{
                transform: "scale(1.03)",
                boxShadow: "0 0 15px rgba(49,130,206,0.5)",
              }}
            >
              {isLogin ? "Log In" : "Sign Up"}
            </Button>

            <Text fontSize="sm" textAlign="center" color="gray.600">
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
              <Link color="blue.600" onClick={() => setIsLogin(!isLogin)} fontWeight="bold">
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
