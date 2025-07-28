import React from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { Issue, IssueStatus } from "../types/issue.ts";
import { MultilineTextInput } from "./MultilineTextInput.tsx";

interface IssueFormProps {
  onSubmit: (issue: Partial<Issue>) => void;
  onCancel: () => void;
}

type FormStep = "title" | "description";

export const IssueForm: React.FC<IssueFormProps> = ({ onSubmit, onCancel }: IssueFormProps) => {
  const [step, setStep] = React.useState<FormStep>("title");
  const [formData, setFormData] = React.useState<Partial<Issue>>({
    title: "",
    description: "",
    status: "plan" as IssueStatus,
  });
  const [currentInput, setCurrentInput] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  // Handle ESC key to cancel and Tab for navigation
  useInput((input, key) => {
    if (key.escape) {
      onCancel();
    }
    
    // Tab to move to next field (from title to description)
    if (key.tab && step === "title" && formData.title) {
      handleSubmit(formData.title);
    }
    
    // Shift+Tab to go back
    if (key.shift && key.tab && step === "description") {
      setStep("title");
      setCurrentInput(formData.title);
    }
  });

  const handleSubmit = (value: string) => {
    setError(null);

    switch (step) {
      case "title":
        if (!value.trim()) {
          setError("Title is required");
          return;
        }
        setFormData((prev: Partial<Issue>) => ({ ...prev, title: value.trim() }));
        setCurrentInput("");
        setStep("description");
        break;

      case "description":
        setFormData((prev: Partial<Issue>) => ({ ...prev, description: value.trim() }));
        onSubmit({ ...formData, description: value.trim() });
        break;
    }
  };

  const renderStep = () => {
    switch (step) {
      case "title":
        return (
          <Box flexDirection="column">
            <Text>Enter issue title:</Text>
            <TextInput
              value={currentInput}
              onChange={setCurrentInput}
              onSubmit={handleSubmit}
            />
          </Box>
        );

      case "description":
        return (
          <Box flexDirection="column">
            <Text>Enter description (optional):</Text>
            <Text color="gray">You can write multiple lines. Press Enter for new line.</Text>
            <Box marginTop={1}>
              <MultilineTextInput
                value={currentInput}
                onChange={setCurrentInput}
                onSubmit={handleSubmit}
                placeholder="Write your description here..."
                rows={5}
                showLineNumbers={true}
              />
            </Box>
          </Box>
        );

    }
  };

  return (
    <Box flexDirection="column">
      <Text bold color="green">Create New Issue</Text>
      <Box marginTop={1} flexDirection="column">
        {error && (
          <Text color="red">Error: {error}</Text>
        )}
        {renderStep()}
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text color="gray">
          {step === "title" ? "Tab: Next field • " : ""}
          {step === "description" ? "Shift+Tab: Previous field • Ctrl+Enter: Submit • " : ""}
          ESC: Cancel
        </Text>
      </Box>
    </Box>
  );
};