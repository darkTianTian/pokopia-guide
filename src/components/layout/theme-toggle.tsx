"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
    const { setTheme } = useTheme()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary outline-none">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl border-border/40 bg-background/95 p-2 shadow-xl backdrop-blur-3xl">
                <DropdownMenuItem onClick={() => setTheme("light")} className="rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus:bg-primary/10 focus:text-primary cursor-pointer gap-2">
                    <Sun className="h-4 w-4" /> Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus:bg-primary/10 focus:text-primary cursor-pointer gap-2">
                    <Moon className="h-4 w-4" /> Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus:bg-primary/10 focus:text-primary cursor-pointer gap-2">
                    <Monitor className="h-4 w-4" /> System
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
