import { Box } from "@chakra-ui/react";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // <-- New Imports
import CodeEditor from "./components/CodeEditor";

function App() {
  return (
    // 1. Wrap the entire application in the Router
    <Router>
      <Box minH="100vh" bg="#0f0a19" color="gray.500" px={6} py={8}>
        
        {/* 2. Define the Routes */}
        <Routes>
          
          {/* Path for starting a new session (no token) */}
          <Route path="/" element={<CodeEditor />} />

          {/* Path for joining an existing session (with a token) */}
          <Route path="/editor/:token" element={<CodeEditor />} />
          
          {/* Optional: Add a 404/Not Found page */}
          <Route path="*" element={
            <Box textAlign="center" mt={20} fontSize="xl">
                404 | Page Not Found
            </Box>
          } />

        </Routes>
      </Box>
    </Router>
  );
}

export default App;