
declare global {
  interface Window {
    copyProtectionHandlers?: {
      handleContextMenu: (e: Event) => void;
      handleKeyDown: (e: KeyboardEvent) => void;
      handleSelectStart: (e: Event) => void;
      handleDragStart: (e: Event) => void;
    };
  }
}

export {};
