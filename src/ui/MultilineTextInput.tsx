import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";

interface MultilineTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  rows?: number;
  showLineNumbers?: boolean;
  focus?: boolean;
}

export const MultilineTextInput: React.FC<MultilineTextInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "",
  rows = 5,
  showLineNumbers = false,
  focus = true,
}: MultilineTextInputProps) => {
  // Split the value into lines
  const lines = value.split("\n");
  const [currentLine, setCurrentLine] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isEditing, setIsEditing] = useState(focus);

  // Ensure we have at least 'rows' number of lines
  const displayLines = [...lines];
  while (displayLines.length < rows) {
    displayLines.push("");
  }

  // Handle keyboard input for navigation
  useInput((input, key) => {
    if (!isEditing) return;

    if (key.upArrow && currentLine > 0) {
      setCurrentLine(currentLine - 1);
      setCursorPosition(Math.min(cursorPosition, displayLines[currentLine - 1].length));
    } else if (key.downArrow && currentLine < displayLines.length - 1) {
      setCurrentLine(currentLine + 1);
      setCursorPosition(Math.min(cursorPosition, displayLines[currentLine + 1].length));
    } else if (key.ctrl && key.return) {
      // Ctrl+Enter to submit
      if (onSubmit) {
        onSubmit(value);
      }
    }
  });

  // Handle text changes for the current line
  const handleLineChange = (newText: string) => {
    const newLines = [...displayLines];
    newLines[currentLine] = newText;
    
    // Remove empty trailing lines beyond the original content
    let lastNonEmptyIndex = newLines.length - 1;
    for (let i = newLines.length - 1; i >= 0; i--) {
      if (newLines[i] !== "") {
        lastNonEmptyIndex = i;
        break;
      }
    }
    
    // Keep at least one line
    const trimmedLines = newLines.slice(0, Math.max(lastNonEmptyIndex + 1, 1));
    onChange(trimmedLines.join("\n"));
  };

  // Handle Enter key in TextInput
  const handleSubmit = () => {
    // Insert a new line after the current line
    const newLines = [...displayLines];
    const currentLineText = newLines[currentLine];
    const beforeCursor = currentLineText.substring(0, cursorPosition);
    const afterCursor = currentLineText.substring(cursorPosition);
    
    newLines[currentLine] = beforeCursor;
    newLines.splice(currentLine + 1, 0, afterCursor);
    
    onChange(newLines.join("\n"));
    setCurrentLine(currentLine + 1);
    setCursorPosition(0);
  };

  return (
    <Box flexDirection="column">
      {displayLines.slice(0, rows).map((line, index) => (
        <Box key={index} flexDirection="row">
          {showLineNumbers && (
            <Box marginRight={1}>
              <Text color="gray">{String(index + 1).padStart(2, " ")}:</Text>
            </Box>
          )}
          {index === currentLine && isEditing ? (
            <TextInput
              value={line}
              onChange={(value) => {
                handleLineChange(value);
                setCursorPosition(value.length);
              }}
              onSubmit={handleSubmit}
              placeholder={index === 0 ? placeholder : ""}
            />
          ) : (
            <Text color={line === "" ? "gray" : undefined}>
              {line === "" && index === 0 ? placeholder : line || " "}
            </Text>
          )}
        </Box>
      ))}
      <Box marginTop={1}>
        <Text color="gray">
          Line {currentLine + 1}/{Math.max(lines.length, 1)} • Use ↑↓ to navigate • Ctrl+Enter to submit
        </Text>
      </Box>
    </Box>
  );
};