"use client"

import { useEffect, useState } from "react"
import { Check, Merge, QrCode, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCollection } from "@/hooks/use-collection"
import { decodeCollection, parseSyncHash } from "@/lib/collection-sync"

interface SyncImportBannerProps {
  orderedSlugs: readonly string[]
  translations: Record<string, string>
}

export function SyncImportBanner({
  orderedSlugs,
  translations,
}: SyncImportBannerProps) {
  const { replaceAll, mergeWith, mounted } = useCollection()
  const [incomingSlugs, setIncomingSlugs] = useState<string[] | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const t = (key: string) => translations[key] ?? key

  useEffect(() => {
    if (!mounted) return

    const encoded = parseSyncHash(window.location.hash)
    if (!encoded) return

    const slugs = decodeCollection(encoded, orderedSlugs)
    if (slugs && slugs.length > 0) {
      setIncomingSlugs(slugs)
    }
  }, [mounted, orderedSlugs])

  const clearHash = () => {
    history.replaceState(null, "", window.location.pathname + window.location.search)
  }

  const handleReplace = () => {
    if (!incomingSlugs) return
    replaceAll(incomingSlugs)
    setIncomingSlugs(null)
    setSuccess(t("collection.sync.successReplace"))
    clearHash()
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleMerge = () => {
    if (!incomingSlugs) return
    mergeWith(incomingSlugs)
    setIncomingSlugs(null)
    setSuccess(t("collection.sync.successMerge"))
    clearHash()
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleCancel = () => {
    setIncomingSlugs(null)
    clearHash()
  }

  if (success) {
    return (
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
        <Check className="h-4 w-4 shrink-0" />
        {success}
      </div>
    )
  }

  if (!incomingSlugs) return null

  return (
    <div className="mb-4 rounded-xl border-2 border-amber-400/60 bg-amber-50 dark:bg-amber-950/40 px-5 py-4 shadow-lg animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/20">
          <QrCode className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
        </div>
        <span className="text-base font-bold text-foreground">
          {t("collection.sync.importCount").replace("{{count}}", String(incomingSlugs.length))}
        </span>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleReplace}
          className="flex-1 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-sm"
        >
          <Check className="h-4 w-4 mr-1" />
          {t("collection.sync.replace")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleMerge}
          className="flex-1 rounded-full text-sm font-semibold shadow-sm"
        >
          <Merge className="h-4 w-4 mr-1" />
          {t("collection.sync.merge")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          className="rounded-full text-sm"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
