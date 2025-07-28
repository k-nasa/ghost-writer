import React from "react";
import { Box, Text } from "ink";

interface AppProps {
  command: string;
  args: Record<string, unknown>;
}

export const App: React.FC<AppProps> = ({ command, args }) => {
  return (
    <Box flexDirection="column">
      <Text color="green" bold>Ghost Writer TUI</Text>
      <Text>Command: {command}</Text>
      <Text>Args: {JSON.stringify(args)}</Text>
    </Box>
  );
};