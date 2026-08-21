"use client";

import * as React from "react";
import { useDrop } from "react-dnd";

import { cn } from "@/lib/utils";

interface DroppableProps {
  accept: string | string[];
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onDrop?: (item: unknown, monitor: unknown) => void;
  onDragOver?: (item: unknown, monitor: unknown) => void;
  onDragLeave?: () => void;
  hoverClassName?: string;
  canDropClassName?: string;
  activeClassName?: string;
  disabledClassName?: string;
}

export const Droppable = React.forwardRef<
  HTMLDivElement,
  DroppableProps & React.HTMLAttributes<HTMLDivElement>
>(function Droppable(
  {
    accept,
    children,
    className,
    disabled = false,
    onDrop,
    onDragOver,
    onDragLeave,
    hoverClassName,
    canDropClassName,
    activeClassName,
    disabledClassName,
    ...props
  },
  ref,
) {
  const [{ canDrop, isOver }, dropRef] = useDrop<
    unknown,
    unknown,
    { canDrop: boolean; isOver: boolean }
  >({
    accept,
    canDrop: () => !disabled,
    drop: (item, monitor) => {
      onDrop?.(item, monitor);
      return undefined;
    },
    hover: (item, monitor) => {
      onDragOver?.(item, monitor);
    },
    collect: (monitor) => ({
      canDrop: monitor.canDrop(),
      isOver: monitor.isOver(),
    }),
  });

  const combinedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      dropRef(node);
      if (ref) {
        if (typeof ref === "function") {
          ref(node);
        } else {
          ref.current = node;
        }
      }
    },
    [dropRef, ref],
  );

  return (
    <div
      ref={combinedRef}
      className={cn(
        "relative transition-all duration-200 ease-in-out",
        isOver && canDrop && hoverClassName,
        canDrop && !isOver && canDropClassName,
        isOver && activeClassName,
        disabled && disabledClassName,
        className,
      )}
      data-slot="droppable"
      onDragLeave={onDragLeave}
      {...props}
    >
      {children}
    </div>
  );
});
