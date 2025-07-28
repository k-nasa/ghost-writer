import React from "react";
import { Box, Text, useInput } from "ink";

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  useInput((input, key) => {
    if (input.toLowerCase() === "y") {
      onConfirm();
    } else if (input.toLowerCase() === "n" || key.escape) {
      onCancel();
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="red"
      padding={1}
      marginX={4}
      marginY={2}
    >
      <Box marginBottom={1}>
        <Text bold color="red">⚠️  Warning</Text>
      </Box>
      
      <Box marginBottom={1}>
        <Text>{message}</Text>
      </Box>
      
      <Box>
        <Text color="yellow">Press </Text>
        <Text color="green" bold>Y</Text>
        <Text color="yellow"> to confirm or </Text>
        <Text color="red" bold>N</Text>
        <Text color="yellow">/</Text>
        <Text color="red" bold>ESC</Text>
        <Text color="yellow"> to cancel</Text>
      </Box>
    </Box>
  );
};