"use client"

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react"

const STORAGE_KEY = "pokopia-collection"

// ── Module-level shared store ───────────────────────────────────────
let currentItems: Set<string> = new Set()
const listeners = new Set<() => void>()

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot(): Set<string> {
  return currentItems
}

const EMPTY_SET: Set<string> = new Set()

function getServerSnapshot(): Set<string> {
  return EMPTY_SET
}

function loadFromStorage(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed: string[] = JSON.parse(raw)
    return new Set(parsed)
  } catch {
    return new Set()
  }
}

function saveToStorage(items: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(items)))
}

// Hydrate once on first client load
let hydrated = false
function hydrate() {
  if (hydrated) return
  hydrated = true
  currentItems = loadFromStorage()

  // Cross-tab sync
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      currentItems = loadFromStorage()
      emitChange()
    }
  })
}

function toggle(id: string) {
  const next = new Set(currentItems)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  currentItems = next
  saveToStorage(next)
  emitChange()
}

// ── Hook ────────────────────────────────────────────────────────────
export function useCollection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    hydrate()
    emitChange()
    setMounted(true)
  }, [])

  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const has = useCallback(
    (id: string) => items.has(id),
    [items]
  )

  const count = useMemo(() => items.size, [items])

  return { items, toggle, has, count, mounted }
}
