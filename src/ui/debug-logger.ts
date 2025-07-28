import { useRef, useEffect } from "react";
import { ensureFileSync } from "https://deno.land/std@0.208.0/fs/ensure_file.ts";

const LOG_FILE = ".ghost/debug.log";

// ログファイルを初期化
export function initDebugLog() {
  try {
    ensureFileSync(LOG_FILE);
    Deno.writeTextFileSync(LOG_FILE, `\n=== Debug session started at ${new Date().toISOString()} ===\n`, { append: true });
  } catch (error) {
    // ログファイルの作成に失敗しても処理を続行
  }
}

// デバッグログをファイルに書き込む
export function debugLog(componentName: string, message: string) {
  try {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    const logMessage = `[${timestamp}] ${componentName}: ${message}\n`;
    Deno.writeTextFileSync(LOG_FILE, logMessage, { append: true });
  } catch (error) {
    // ログ書き込みに失敗しても処理を続行
  }
}

// レンダリング追跡用のReact Hook
export function useRenderTracker(componentName: string, props?: Record<string, any>) {
  const renderCountRef = useRef(0);
  const previousPropsRef = useRef<Record<string, any> | undefined>(props);
  
  // Increment render count on every render
  renderCountRef.current += 1;
  
  // Track prop changes
  useEffect(() => {
    let message = `Rendered (count: ${renderCountRef.current})`;
    
    if (props && previousPropsRef.current) {
      const changedProps: string[] = [];
      Object.keys(props).forEach((key) => {
        if (previousPropsRef.current![key] !== props[key]) {
          changedProps.push(key);
        }
      });
      
      if (changedProps.length > 0) {
        message += ` - Changed props: ${changedProps.join(', ')}`;
      }
    }
    
    if (props) {
      const propInfo = Object.entries(props)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(', ');
      message += ` - Props: {${propInfo}}`;
    }
    
    debugLog(componentName, message);
    previousPropsRef.current = props;
  });
  
  return {
    trackRender: (additionalInfo?: string) => {
      let message = `Manual track (count: ${renderCountRef.current})`;
      if (additionalInfo) {
        message += ` - ${additionalInfo}`;
      }
      debugLog(componentName, message);
    }
  };
}