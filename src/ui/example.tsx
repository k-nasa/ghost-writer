import React from "react";
import { render, Text, Box } from "ink";

const Example = () => {
  const [counter, setCounter] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCounter((prev) => prev + 1);
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Box flexDirection="column">
      <Text color="green">Hello from React Ink in Deno!</Text>
      <Text>Counter: {counter}</Text>
    </Box>
  );
};

if (import.meta.main) {
  render(<Example />);
}