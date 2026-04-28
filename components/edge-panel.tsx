"use client"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { ReactNode, useEffect, useId, useRef, useState } from "react"

type EdgePanelProps = {
    children: ReactNode;
    width?: number;
    initialY?: number;
    className?: string;
    handleAriaLabel?: string;
};


export function EdgePanel(
    {
        children,
        width = 100,
        initialY,
        className = "",
        handleAriaLabel = "Edge panel handle",
    }: EdgePanelProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [top, setTop] = useState(initialY ?? 100)
    const isDraggingRef = useRef(false)
    const dragStartOffsetRef = useRef(0)
    const movedRef = useRef(false)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const contentId = useId()
    const isMobile = useIsMobile()
    const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 0);



    useEffect(() => {
        if (initialY == null && typeof window !== "undefined") {
            const handleHeight = 120
            const bottomOffsetRatio = 0.05
            const availableHeight = window.innerHeight - handleHeight
            const calculatedTop = availableHeight * (1 - bottomOffsetRatio)
            setTop(
                Math.max(16, Math.min(calculatedTop, window.innerHeight - handleHeight - 16))
            )
        }
    }, [initialY])


    useEffect(() => {
        if (!isOpen) return
        function onDocPointerDown(e: PointerEvent) {
            if (!containerRef.current) return
            if (!containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("pointerdown", onDocPointerDown)
        return () => document.removeEventListener("pointerdown", onDocPointerDown)
    }, [isOpen])

    useEffect(() => {
        function onMove(e: PointerEvent) {
            if (!isDraggingRef.current) return
            movedRef.current = true
            const handleHeight = 120
            const margin = 16
            const clientY = e.clientY - dragStartOffsetRef.current
            const maxTop = Math.max(0, (window.innerHeight || 0) - handleHeight - margin)
            const clamped = Math.max(margin, Math.min(clientY, maxTop))
            setTop(clamped)
            e.preventDefault()
        }
        function onUp() {
            if (isDraggingRef.current) {
                setTimeout(() => {
                    movedRef.current = false
                }, 0)
            }
            isDraggingRef.current = false
        }
        window.addEventListener("pointermove", onMove, { passive: false })
        window.addEventListener("pointerup", onUp)
        window.addEventListener("pointercancel", onUp)
        return () => {
            window.removeEventListener("pointermove", onMove)
            window.removeEventListener("pointerup", onUp)
            window.removeEventListener("pointercancel", onUp)
        }
    }, [])

    function onHandlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {

        isDraggingRef.current = true
        movedRef.current = false
        const handleRect = (e.currentTarget).getBoundingClientRect()
        dragStartOffsetRef.current = e.clientY - handleRect.top;
        (e.currentTarget).setPointerCapture?.(e.pointerId)
        e.preventDefault()
    }

    function onHandleClick() {

        if (movedRef.current) return
        setIsOpen((v) => !v)
    }

    function onHandleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setIsOpen((v) => !v)
        }
    }


    useEffect(() => {
        if (typeof window === "undefined") return;
        const onResize = () => setVw(window.innerWidth);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const mobilePx = Math.max(vw - 30, 0);
    const transformValue = isOpen
        ? (isMobile ? `translateX(-${mobilePx}px)` : `translateX(-${width}px)`)
        : "translateX(0)";

    if (isMobile) return null
    return (
        <div
            ref={containerRef}
            className={cn("fixed select-none", className)}
            style={{ top, right: 0 }}
            aria-live="polite"
        >
            <div
                id={contentId}
                className={cn(
                    "pointer-events-auto fixed right-0",
                    "shadow-lg rounded-s-lg",
                    "bg-card text-card-foreground",
                    "transition-transform duration-300 ease-out",
                )}
                style={{
                    top,
                    width: isMobile ? "calc(100vw - 30px)" : width,
                    transform: isOpen ? "translateX(0)" : "translateX(100%)",
                }}
                aria-hidden={!isOpen}
            >
                <div className="p-4">{children}</div>
            </div>

            <button
                type="button"
                aria-label={handleAriaLabel}
                aria-expanded={isOpen}
                aria-controls={contentId}
                role="button"
                onPointerDown={onHandlePointerDown}
                onClick={onHandleClick}
                onKeyDown={onHandleKeyDown}
                className={cn(
                    "pointer-events-auto",
                    "h-[50px] w-[20px]",
                    "rounded-s-lg",
                    "bg-primary hover:bg-primary/70 text-primary-foreground",
                    "flex items-center justify-center",
                    "transition-transform duration-300 ease-out",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "touch-none",
                )}
                style={{
                    transform: transformValue
                }}
            >
                {isOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
        </div>
    )
}

export default EdgePanel
