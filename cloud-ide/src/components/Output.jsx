import React from "react";
import { Box, Text } from "@chakra-ui/react";

const Output = ({ output, isError }) => {
  return (
    <Box
      fontFamily="monospace"
      fontSize="sm"
      whiteSpace="pre-wrap"
      color={isError ? "red.400" : "green.300"}
      bg="rgba(17, 25, 40, 0.8)"
      backdropFilter="blur(10px)"
      p={4}
      mt={2}
      h="100%"
      minH="150px"
      overflowY="auto"
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
  );
};

export default Output;