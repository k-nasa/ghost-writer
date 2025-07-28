import React, { useRef, useEffect } from "react";
import { Text } from "ink";

interface RenderTrackerProps {
  name: string;
  props?: Record<string, any>;
  showInUI?: boolean;
}

export const RenderTracker: React.FC<RenderTrackerProps> = ({ 
  name, 
  props = {}, 
  showInUI = false 
}: RenderTrackerProps) => {
  const renderCount = useRef(0);
  const previousProps = useRef<Record<string, any>>({});
  
  renderCount.current += 1;
  
  useEffect(() => {
    const changedProps: string[] = [];
    
    // Check which props changed
    Object.keys(props).forEach((key: string) => {
      if (previousProps.current[key] !== props[key]) {
        changedProps.push(key);
      }
    });
    
    // Log to console (will appear in terminal when running)
    console.error(`[RENDER] ${name} - Count: ${renderCount.current}${
      changedProps.length > 0 ? ` - Changed props: ${changedProps.join(', ')}` : ''
    }`);
    
    previousProps.current = { ...props };
  });
  
  if (showInUI) {
    return (
      <Text color="red">
        [{name}: {renderCount.current}]
      </Text>
    );
  }
  
  return null;
};

// HOC to wrap components with render tracking
export function withRenderTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return React.memo((props: P) => {
    return (
      <>
        <RenderTracker name={componentName} props={props as any} />
        <Component {...props} />
      </>
    );
  });
}