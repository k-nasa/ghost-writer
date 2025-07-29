import React from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { MultilineTextInput } from "./MultilineTextInput.tsx";
import { Issue, IssueStatus } from "../types/issue.ts";

interface IssueEditFormProps {
  issue: Issue;
  onSubmit: (updates: Partial<Issue>) => void;
  onCancel: () => void;
}

type FormStep = "title" | "description";

export const IssueEditForm: React.FC<IssueEditFormProps> = ({ issue, onSubmit, onCancel }: IssueEditFormProps) => {
  const [step, setStep] = React.useState<FormStep>("title");
  const [formData, setFormData] = React.useState<Partial<Issue>>({
    title: issue.title,
    description: issue.description || "",
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
        const newTitle = value.trim() || issue.title;
        setFormData((prev: Partial<Issue>) => ({ ...prev, title: newTitle }));
        setCurrentInput(formData.description || "");
        setStep("description");
        break;

      case "description":
        setFormData((prev: Partial<Issue>) => ({ ...prev, description: value.trim() }));
        
        // Only submit changed fields
        const updates: Partial<Issue> = {};
        if (formData.title !== issue.title) updates.title = formData.title;
        if (value.trim() !== issue.description) updates.description = value.trim();
        
        onSubmit(updates);
        break;
    }
  };

  const renderStep = () => {
    switch (step) {
      case "title":
        return (
          <Box flexDirection="column">
            <Text>Edit issue title (current: {issue.title}):</Text>
            <Text color="gray">Press Enter to keep current value</Text>
            <TextInput
              value={currentInput}
              onChange={setCurrentInput}
              onSubmit={handleSubmit}
              placeholder={issue.title}
            />
          </Box>
        );

      case "description":
        return (
          <Box flexDirection="column">
            <Text>Edit description (current: {issue.description || "(none)"}):</Text>
            <Box marginBottom={1}>
              <MultilineTextInput
                value={currentInput}
                onChange={setCurrentInput}
                onSubmit={handleSubmit}
                placeholder={issue.description || "Enter description..."}
                height={5}
                submitOnEnter={true}
              />
            </Box>
          </Box>
        );


    }
  };

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="green" paddingX={1} paddingY={1}>
      <Text bold color="green">Edit Issue: {issue.title}</Text>
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