import React from "react";
import { render, Text, Box, useInput, useApp } from "ink";

const InteractiveExample = () => {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const { exit } = useApp();

  const items = ["Option 1", "Option 2", "Option 3", "Exit"];

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (key.downArrow) {
      setSelectedIndex((prev) => (prev + 1) % items.length);
    } else if (key.return) {
      if (selectedIndex === items.length - 1) {
        exit();
      } else {
        console.log(`Selected: ${items[selectedIndex]}`);
      }
    } else if (input === "q") {
      exit();
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold color="green">Interactive Menu (Use ↑/↓ arrows and Enter)</Text>
      <Text color="gray">Press 'q' to quit</Text>
      <Box marginTop={1} flexDirection="column">
        {items.map((item, index) => (
          <Text key={item} color={selectedIndex === index ? "blue" : "white"}>
            {selectedIndex === index ? "▶ " : "  "}
            {item}
          </Text>
        ))}
      </Box>
    </Box>
  );
};

if (import.meta.main) {
  render(<InteractiveExample />);
}