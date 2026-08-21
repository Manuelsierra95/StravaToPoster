"use client";

import * as React from "react";
import { useDrag } from "react-dnd";

import { cn } from "@/lib/utils";

export interface DragItem {
  id: string;
  type: string;
  [key: string]: unknown;
}

interface DraggableProps {
  children: React.ReactNode;
  item: DragItem;
  className?: string;
  disabled?: boolean;
  dragPreview?: React.ReactNode;
}

export const Draggable = React.forwardRef<
  HTMLDivElement,
  DraggableProps & React.HTMLAttributes<HTMLDivElement>
>(function Draggable(
  {
    children,
    item,
    className,
    disabled = false,
    dragPreview,
    ...props
  },
  ref,
) {
  const [{ isDragging }, dragRef] = useDrag<
    DragItem,
    DragItem,
    { isDragging: boolean }
  >({
    type: item.type,
    item,
    canDrag: !disabled,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const combinedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      dragRef(node);
      if (ref) {
        if (typeof ref === "function") {
          ref(node);
        } else {
          ref.current = node;
        }
      }
    },
    [dragRef, ref],
  );

  return (
    <div
      ref={combinedRef}
      className={cn(
        "relative transition-all duration-200 ease-in-out",
        isDragging && "opacity-50 scale-[1.02]",
        !disabled && !isDragging && "cursor-grab active:cursor-grabbing",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
      data-slot="draggable"
      {...props}
    >
      {children}
      {isDragging && dragPreview && (
        <div className="pointer-events-none absolute inset-0">{dragPreview}</div>
      )}
    </div>
  );
});
