import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { Issue, IssueStatus } from "../types/issue.ts";

interface IssueEditFormProps {
  issue: Issue;
  onSubmit: (updates: Partial<Issue>) => void;
  onCancel: () => void;
}

type FormStep = "title" | "description" | "confirm";

export const IssueEditForm: React.FC<IssueEditFormProps> = ({ issue, onSubmit, onCancel }: IssueEditFormProps) => {
  const [step, setStep] = React.useState<FormStep>("title");
  const [formData, setFormData] = React.useState<Partial<Issue>>({
    title: issue.title,
    description: issue.description || "",
  });
  const [currentInput, setCurrentInput] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

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
        setCurrentInput("");
        setStep("confirm");
        break;

      case "confirm":
        if (value.toLowerCase() === "y") {
          // Only submit changed fields
          const updates: Partial<Issue> = {};
          if (formData.title !== issue.title) updates.title = formData.title;
          if (formData.description !== issue.description) updates.description = formData.description;
          
          onSubmit(updates);
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
            <Text color="gray">Press Enter to keep current value</Text>
            <TextInput
              value={currentInput}
              onChange={setCurrentInput}
              onSubmit={handleSubmit}
              placeholder={issue.description || ""}
            />
          </Box>
        );


      case "confirm":
        return (
          <Box flexDirection="column">
            <Text bold color="green">Review changes:</Text>
            <Box marginTop={1} flexDirection="column">
              {formData.title !== issue.title && (
                <Text>Title: {issue.title} → {formData.title}</Text>
              )}
              {formData.description !== issue.description && (
                <Text>Description: {issue.description || "(none)"} → {formData.description || "(none)"}</Text>
              )}
              {formData.title === issue.title && 
               formData.description === issue.description && (
                <Text color="gray">No changes made</Text>
              )}
            </Box>
            <Box marginTop={1}>
              <Text>Save changes? (y/n):</Text>
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
      <Text bold color="green">Edit Issue: {issue.title}</Text>
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