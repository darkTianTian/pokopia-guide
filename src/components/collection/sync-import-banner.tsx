"use client"

import { useEffect, useState } from "react"
import { Check, Merge, X } from "lucide-react"
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
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 shadow-sm">
      <span className="text-sm font-medium text-foreground">
        {t("collection.sync.importCount").replace("{{count}}", String(incomingSlugs.length))}
      </span>
      <div className="flex gap-2 ml-auto">
        <Button
          size="sm"
          variant="default"
          onClick={handleReplace}
          className="rounded-full text-xs"
        >
          <Check className="h-3.5 w-3.5 mr-1" />
          {t("collection.sync.replace")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleMerge}
          className="rounded-full text-xs"
        >
          <Merge className="h-3.5 w-3.5 mr-1" />
          {t("collection.sync.merge")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          className="rounded-full text-xs"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          {t("collection.sync.cancel")}
        </Button>
      </div>
    </div>
  )
}
