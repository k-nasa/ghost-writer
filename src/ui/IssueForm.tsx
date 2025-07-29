import React from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { Issue, IssueStatus } from "../types/issue.ts";

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

  // Handle ESC key to cancel
  useInput((input, key) => {
    if (key.escape) {
      onCancel();
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
            <TextInput
              value={currentInput}
              onChange={setCurrentInput}
              onSubmit={handleSubmit}
            />
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
      <Box marginTop={1}>
        <Text color="gray">Press ESC to cancel</Text>
      </Box>
    </Box>
  );
};