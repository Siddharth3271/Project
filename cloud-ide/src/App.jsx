import { Box } from "@chakra-ui/react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CodeEditor from "./components/CodeEditor";
import LandingPage from "./components/landing/LandingPage";
import AuthForm from "./components/landing/Authform"; // 👈 import here

function App() {
  return (
    <Router>
      <Box minH="100vh" bg="#0f0a19" color="gray.500">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthForm />} /> 
          <Route path="/editor/:token" element={<CodeEditor />} />
          <Route path="/editor/new" element={<CodeEditor />} />

          <Route
            path="*"
            element={
              <Box textAlign="center" mt={20} fontSize="xl">
                404 | Page Not Found
              </Box>
            }
          />
        </Routes>
      </Box>
    </Router>
  );
}

export default App;
