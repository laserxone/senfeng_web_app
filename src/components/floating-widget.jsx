"use client";
import { DndContext, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

function DraggableGroup({ id, children, position, onPositionChange }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

  const style = {
    transform: CSS.Translate.toString({
      x: (position?.x || 0) + (transform?.x || 0),
      y: (position?.y || 0) + (transform?.y || 0),
    }),
    touchAction: "none",
    position: "fixed",
    bottom: "1.5rem", 
    right: "1.5rem",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
}

export default function FloatingWidgets({ children }) {
  const [position, setPosition] = useState(null);

  
  const handleDragEnd = (event) => {
    const { delta } = event;
    setPosition((prev) => {
      const newPos = {
        x: (prev?.x || 0) + delta.x,
        y: (prev?.y || 0) + delta.y,
      };
      return newPos;
    });
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <DraggableGroup
        id="floating-group"
        position={position}
        onPositionChange={setPosition}
      >
        {children}
      </DraggableGroup>
    </DndContext>
  );
}
