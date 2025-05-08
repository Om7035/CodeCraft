declare global {
  interface Window {
    monaco: any;
  }
}

interface Window {
  currentFilePath: string;
}

export {};

// Removed duplicate declaration
