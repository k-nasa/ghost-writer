import React from "react";
import { Box, Text } from "ink";

interface BreadcrumbProps {
  items: string[];
  maxItems?: number;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  maxItems = 4
}: BreadcrumbProps) => {
  if (items.length === 0) return null;

  let displayItems = items;
  let showEllipsis = false;

  // If we have too many items, show ellipsis
  if (items.length > maxItems) {
    showEllipsis = true;
    displayItems = [
      items[0], // Always show root
      "...",
      ...items.slice(-(maxItems - 2))
    ];
  }

  return (
    <Box marginBottom={1}>
      <Text color="gray">📍 </Text>
      {displayItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <Text color="gray"> › </Text>}
          <Text 
            color={index === displayItems.length - 1 ? "cyan" : "gray"}
            bold={index === displayItems.length - 1}
          >
            {item}
          </Text>
        </React.Fragment>
      ))}
    </Box>
  );
};