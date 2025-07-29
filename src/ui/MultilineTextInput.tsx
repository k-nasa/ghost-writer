import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";

interface MultilineTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  height?: number;
  submitOnEnter?: boolean;
}

export const MultilineTextInput: React.FC<MultilineTextInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "",
  height = 5,
  submitOnEnter = false,
}: MultilineTextInputProps) => {
  const [lines, setLines] = useState<string[]>(() => value.split("\n"));
  const [cursorLine, setCursorLine] = useState(0);
  const [cursorColumn, setCursorColumn] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const newLines = value.split("\n");
    setLines(newLines);
  }, [value]);

  useEffect(() => {
    const newValue = lines.join("\n");
    onChange(newValue);
  }, [lines, onChange]);

  useInput((input, key) => {
    if (!isActive) return;

    if (key.return) {
      if (submitOnEnter && !key.shift) {
        // Enter to submit (when submitOnEnter is true)
        onSubmit(lines.join("\n"));
        return;
      } else if (!submitOnEnter && key.ctrl) {
        // Ctrl+Enter to submit (when submitOnEnter is false)
        onSubmit(lines.join("\n"));
        return;
      } else if (!submitOnEnter || key.shift) {
        // Enter or Shift+Enter to create new line
        const currentLine = lines[cursorLine] || "";
        const beforeCursor = currentLine.slice(0, cursorColumn);
        const afterCursor = currentLine.slice(cursorColumn);
        
        const newLines = [...lines];
        newLines[cursorLine] = beforeCursor;
        newLines.splice(cursorLine + 1, 0, afterCursor);
        
        setLines(newLines);
        setCursorLine(cursorLine + 1);
        setCursorColumn(0);
        return;
      }
    }

    if (key.backspace || key.delete) {
      if (cursorColumn === 0 && cursorLine > 0) {
        // Merge with previous line
        const newLines = [...lines];
        const prevLine = newLines[cursorLine - 1];
        const currentLine = newLines[cursorLine];
        newLines[cursorLine - 1] = prevLine + currentLine;
        newLines.splice(cursorLine, 1);
        
        setLines(newLines);
        setCursorLine(cursorLine - 1);
        setCursorColumn(prevLine.length);
      } else if (cursorColumn > 0) {
        // Delete character
        const newLines = [...lines];
        const line = newLines[cursorLine];
        newLines[cursorLine] = line.slice(0, cursorColumn - 1) + line.slice(cursorColumn);
        
        setLines(newLines);
        setCursorColumn(cursorColumn - 1);
      }
      return;
    }

    if (key.upArrow) {
      if (cursorLine > 0) {
        setCursorLine(cursorLine - 1);
        const nextLineLength = lines[cursorLine - 1]?.length || 0;
        setCursorColumn(Math.min(cursorColumn, nextLineLength));
      }
      return;
    }

    if (key.downArrow) {
      if (cursorLine < lines.length - 1) {
        setCursorLine(cursorLine + 1);
        const nextLineLength = lines[cursorLine + 1]?.length || 0;
        setCursorColumn(Math.min(cursorColumn, nextLineLength));
      }
      return;
    }

    if (key.leftArrow) {
      if (cursorColumn > 0) {
        setCursorColumn(cursorColumn - 1);
      } else if (cursorLine > 0) {
        setCursorLine(cursorLine - 1);
        setCursorColumn(lines[cursorLine - 1]?.length || 0);
      }
      return;
    }

    if (key.rightArrow) {
      const currentLineLength = lines[cursorLine]?.length || 0;
      if (cursorColumn < currentLineLength) {
        setCursorColumn(cursorColumn + 1);
      } else if (cursorLine < lines.length - 1) {
        setCursorLine(cursorLine + 1);
        setCursorColumn(0);
      }
      return;
    }

    // Regular character input
    if (input && !key.ctrl && !key.meta) {
      const newLines = [...lines];
      const line = newLines[cursorLine] || "";
      newLines[cursorLine] = line.slice(0, cursorColumn) + input + line.slice(cursorColumn);
      
      setLines(newLines);
      setCursorColumn(cursorColumn + input.length);
    }
  });

  // Ensure we have at least one line
  const displayLines = lines.length === 0 ? [""] : lines;

  // Add empty lines to reach minimum height
  while (displayLines.length < height) {
    displayLines.push("");
  }

  return (
    <Box flexDirection="column">
      {displayLines.slice(0, height).map((line: string, lineIndex: number) => (
        <Box key={lineIndex}>
          <Text>
            {lineIndex === cursorLine ? (
              <>
                {line.slice(0, cursorColumn)}
                <Text inverse>{line[cursorColumn] || " "}</Text>
                {line.slice(cursorColumn + 1)}
              </>
            ) : (
              line || (lineIndex === 0 && !value ? placeholder : " ")
            )}
          </Text>
        </Box>
      ))}
      <Box marginTop={1}>
        <Text color="gray">
          {submitOnEnter 
            ? "Press Enter to submit, Shift+Enter for new line" 
            : "Press Ctrl+Enter to submit, Enter for new line"}
        </Text>
      </Box>
    </Box>
  );
};