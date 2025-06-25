/**
 * This file provides a global type definition for the `ErrorUtils` object,
 * which is a global variable injected by the React Native runtime.
 * It should not be imported.
 */
declare global {
  const ErrorUtils: {
    getGlobalHandler: () => (error: Error, isFatal?: boolean) => void;
    setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
  };
}

// This export statement is required to make this file a module.
export {};
