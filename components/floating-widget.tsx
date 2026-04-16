"use client";
import { DndContext, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { GripVertical, ChevronRight } from "lucide-react";

function DraggableGroup({ id, children, position, expanded, onToggle }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

  // Only vertical movement
const y = (position?.y ?? 0) + (transform?.y ?? 0);

const style = {
  transform: CSS.Translate.toString({
    x: 0,
    y,
    scaleX: 1,
    scaleY: 1,
  }),
    touchAction: "none",
    position: "fixed",
    top: "40%",
    right: expanded ? "1rem" : "1rem",
    zIndex: 50,
    transition: "right 0.3s ease",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="relative">
        {/* DRAG HANDLE (small invisible area) */}
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-3 top-1/2 -translate-y-1/2 w-2 h-10 cursor-grab"
          title="Drag up/down"
        ></div>

        {/* CLICKABLE BUTTON */}
        <div
          onClick={onToggle}
          className="flex justify-center items-center cursor-pointer bg-blue-600 text-white w-10 h-10 rounded-full shadow-lg hover:bg-blue-700"
        >
          {expanded ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <GripVertical className="w-5 h-5" />
          )}
        </div>

        {/* CHILDREN PANEL */}
        <div
          className={`absolute top-0 right-2 transition-all duration-300 overflow-hidden ${
            expanded ? "opacity-100 p-4" : "opacity-0 w-0 p-0"
          }`}
        >
          {expanded && children}
        </div>
      </div>
    </div>
  );
}

export default function FloatingWidgets({ children }) {
  const [position, setPosition] = useState({ y: 0 });
  const [expanded, setExpanded] = useState(false);

  const handleDragEnd = (event) => {
    const { delta } = event;
    setPosition((prev) => ({
      y: (prev?.y || 0) + delta.y,
    }));
  };

  const toggleExpand = () => {
    setExpanded((prev) => !prev);
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <DraggableGroup
        id="floating-group"
        position={position}
        expanded={expanded}
        onToggle={toggleExpand}
      >
        {children}
      </DraggableGroup>
    </DndContext>
  );
}
