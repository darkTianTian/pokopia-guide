"use client"

import { useState, useEffect, type ReactNode } from "react"

interface BrowseByCollapsibleProps {
    title: string
    children: ReactNode
}

export function BrowseByCollapsible({ title, children }: BrowseByCollapsibleProps) {
    // Default to true for SSR so search engines can see it, and desktop users don't see a flash of hidden content
    const [isOpen, setIsOpen] = useState(true)

    useEffect(() => {
        // If client is mobile, collapse immediately on mount
        if (window.innerWidth < 768) {
            setIsOpen(false)
        }
    }, [])

    return (
        <div className="mb-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors -ml-2 p-2 rounded-lg hover:bg-muted/50 active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                aria-expanded={isOpen}
            >
                <span>{title}</span>
                <svg
                    className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
            >
                <div className="overflow-hidden">
                    {children}
                </div>
            </div>
        </div>
    )
}
