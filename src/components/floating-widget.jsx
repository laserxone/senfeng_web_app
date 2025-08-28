"use client";
import { DndContext, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { GripVertical } from "lucide-react"; // 👈 nice drag icon

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
    <div ref={setNodeRef} style={style}>
      {/* Drag handle with icon */}
      <div
        {...listeners}
        {...attributes}
        className="flex justify-center cursor-grab bg-gray-800 text-white w-8 h-8 rounded-full mb-2 shadow-md hover:bg-gray-700"
      >
        <GripVertical className="w-5 h-5 self-center" />
      </div>

      {/* Children remain fully clickable */}
      <div>{children}</div>
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
