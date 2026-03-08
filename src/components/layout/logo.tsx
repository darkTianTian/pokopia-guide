import { Fredoka } from "next/font/google"

const fredoka = Fredoka({
    subsets: ["latin"],
    weight: ["600", "700"],
})

export function SwitchIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
        >
            {/* Left Joycon (Cyan/Blue) */}
            <path fill="#00c3e3" d="M6.5 4C4.567 4 3 5.567 3 7.5v9C3 18.433 4.567 20 6.5 20H8V4H6.5zM6 8.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
            {/* Right Joycon (Red) */}
            <path fill="#ff4554" d="M17.5 4H16v16h1.5c1.933 0 3.5-1.567 3.5-3.5v-9C21 5.567 19.433 4 17.5 4zm1 9a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
            {/* Screen (Dark Gray) */}
            <path fill="#333333" d="M9 4h6v16H9z" />
        </svg>
    )
}

const COLORS = [
    "#38bdf8", // light blue
    "#fb923c", // orange
    "#4ade80", // green
    "#c084fc", // purple
    "#f472b6", // pink
    "#fbbf24", // yellow
]

export function SiteLogo({ text }: { text: string }) {
    // Split the text into characters to color them individually
    const chars = text.split("")
    let colorIndex = 0

    return (
        <div className="flex items-center gap-2 transition-transform hover:scale-105">
            <SwitchIcon className="h-8 w-8 drop-shadow-sm" />
            <span
                className={`hidden sm:flex text-3xl font-bold tracking-tight ${fredoka.className}`}
                style={{
                    filter: "drop-shadow(0px 4px 2px rgba(0,0,0,0.15))",
                }}
            >
                {chars.map((char, i) => {
                    if (char === " ") {
                        return <span key={i} className="w-2">{char}</span>
                    }
                    const color = COLORS[colorIndex % COLORS.length]
                    colorIndex++

                    return (
                        <span
                            key={i}
                            className="relative inline-block transition-transform hover:-translate-y-1 hover:rotate-6"
                            style={{
                                color: color,
                                WebkitTextStroke: "5px white",
                                paintOrder: "stroke fill",
                                textShadow: "0 2px 0 rgba(0,0,0,0.1)",
                            }}
                        >
                            {char}
                        </span>
                    )
                })}
            </span>
        </div>
    )
}
