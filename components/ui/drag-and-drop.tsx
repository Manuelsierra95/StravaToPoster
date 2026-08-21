"use client";

import * as React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export interface DragAndDropProviderProps {
  children: React.ReactNode;
}

export function DragAndDropProvider({ children }: DragAndDropProviderProps) {
  return (
    <div data-slot="drag-and-drop-provider">
      <DndProvider backend={HTML5Backend}>{children}</DndProvider>
    </div>
  );
}
