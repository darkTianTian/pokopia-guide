import React from "react"

interface PokeballIconProps extends React.SVGProps<SVGSVGElement> {
    active?: boolean
}

export function PokeballIcon({ active = false, className, ...props }: PokeballIconProps) {
    return (
        <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            {...props}
        >
            {/* Base Circle / Outline */}
            <circle
                cx="50"
                cy="50"
                r="45"
                fill={active ? "white" : "transparent"}
                stroke="currentColor"
                strokeWidth="6"
            />

            {/* Top Red Half (Only visible when active) */}
            {active && (
                <path
                    d="M 50 5 A 45 45 0 0 1 95 50 L 5 50 A 45 45 0 0 1 50 5 Z"
                    fill="#ef4444" // red-500
                />
            )}

            {/* Center Black Line */}
            <line
                x1="5"
                y1="50"
                x2="95"
                y2="50"
                stroke="currentColor"
                strokeWidth="6"
            />

            {/* Outer Button Ring */}
            <circle
                cx="50"
                cy="50"
                r="14"
                fill={active ? "white" : "transparent"}
                stroke="currentColor"
                strokeWidth="6"
            />

            {/* Inner Button Circle */}
            <circle
                cx="50"
                cy="50"
                r="6"
                fill="currentColor"
            />
        </svg>
    )
}
