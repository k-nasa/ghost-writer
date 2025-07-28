import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { Issue, IssueStatus } from "../types/issue.ts";

interface IssueFormProps {
  onSubmit: (issue: Partial<Issue>) => void;
  onCancel: () => void;
}

type FormStep = "title" | "description" | "tags" | "confirm";

export const IssueForm: React.FC<IssueFormProps> = ({ onSubmit, onCancel }: IssueFormProps) => {
  const [step, setStep] = React.useState<FormStep>("title");
  const [formData, setFormData] = React.useState<Partial<Issue>>({
    title: "",
    description: "",
    tags: [],
    status: "plan" as IssueStatus,
  });
  const [currentInput, setCurrentInput] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

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
        setCurrentInput("");
        setStep("tags");
        break;

      case "tags":
        const tags = value.split(",").map(t => t.trim()).filter(t => t);
        setFormData((prev: Partial<Issue>) => ({ ...prev, tags }));
        setCurrentInput("");
        setStep("confirm");
        break;

      case "confirm":
        if (value.toLowerCase() === "y") {
          onSubmit(formData);
        } else {
          onCancel();
        }
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

      case "tags":
        return (
          <Box flexDirection="column">
            <Text>Enter tags (comma-separated, optional):</Text>
            <TextInput
              value={currentInput}
              onChange={setCurrentInput}
              onSubmit={handleSubmit}
            />
          </Box>
        );


      case "confirm":
        return (
          <Box flexDirection="column">
            <Text bold color="green">Review your issue:</Text>
            <Box marginTop={1} flexDirection="column">
              <Text>Title: {formData.title}</Text>
              <Text>Description: {formData.description || "(none)"}</Text>
              <Text>Tags: {formData.tags?.join(", ") || "(none)"}</Text>
            </Box>
            <Box marginTop={1}>
              <Text>Create this issue? (y/n):</Text>
              <TextInput
                value={currentInput}
                onChange={setCurrentInput}
                onSubmit={handleSubmit}
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
      <Box marginTop={1}>
        <Text color="gray">Press Ctrl+C to cancel</Text>
      </Box>
    </Box>
  );
};