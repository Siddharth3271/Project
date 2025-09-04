import { useRef, useState } from "react";
import { Box, HStack } from "@chakra-ui/react";
import { Editor } from "@monaco-editor/react";
import LangaugeSelector from "./LangaugeSelector";

const CodeEditor = () => {
  const editorRef = useRef();
  const [value, setValue] = useState("");

  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  return (
    <Box>
        <LangaugeSelector/>
          <Editor
            height="75vh"
            theme="vs-dark"
            language="cpp"
            onMount={onMount}
            value={value}
            onChange={(value) => setValue(value)}
          />
    </Box>
  );
};
export default CodeEditor;