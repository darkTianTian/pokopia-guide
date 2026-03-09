"use client"

import { useCallback, useRef, useState } from "react"
import { Download, Smartphone, Monitor, Share2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShareCardCanvas } from "./share-card-canvas"

interface ShareCardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  caughtSlugs: string[]
  totalCount: number
  translations: Record<string, string>
}

export function ShareCardModal({
  open,
  onOpenChange,
  caughtSlugs,
  totalCount,
  translations,
}: ShareCardModalProps) {
  const [nickname, setNickname] = useState("")
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait")
  const [generating, setGenerating] = useState(false)
  const getBlobRef = useRef<(() => Promise<Blob>) | null>(null)

  const t = (key: string) => translations[key] ?? key

  const handleReady = useCallback((getBlob: () => Promise<Blob>) => {
    getBlobRef.current = getBlob
  }, [])

  const handleShare = async () => {
    if (!getBlobRef.current) return
    setGenerating(true)

    try {
      const blob = await getBlobRef.current()
      const file = new File([blob], `pokopia-collection-${Date.now()}.png`, {
        type: "image/png",
      })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Pokopia Collection",
          files: [file],
        })
      } else {
        downloadBlob(blob)
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Share failed:", err)
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!getBlobRef.current) return
    setGenerating(true)

    try {
      const blob = await getBlobRef.current()
      downloadBlob(blob)
    } catch (err) {
      console.error("Download failed:", err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-h-[90vh] overflow-y-auto ${orientation === "landscape" ? "sm:max-w-5xl" : "sm:max-w-xl"}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t("collection.shareCard.title")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("collection.shareCard.title")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nickname input */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              {t("collection.shareCard.nickname")}
            </label>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t("collection.shareCard.nicknamePlaceholder")}
              maxLength={20}
            />
          </div>

          {/* Orientation toggle */}
          <div className="flex gap-2">
            <Button
              variant={orientation === "portrait" ? "default" : "outline"}
              size="sm"
              onClick={() => setOrientation("portrait")}
              className="flex-1"
            >
              <Smartphone className="h-4 w-4 mr-1.5" />
              {t("collection.shareCard.portrait")}
            </Button>
            <Button
              variant={orientation === "landscape" ? "default" : "outline"}
              size="sm"
              onClick={() => setOrientation("landscape")}
              className="flex-1"
            >
              <Monitor className="h-4 w-4 mr-1.5" />
              {t("collection.shareCard.landscape")}
            </Button>
          </div>

          {/* Canvas preview */}
          <ShareCardCanvas
            orientation={orientation}
            nickname={nickname}
            caughtSlugs={caughtSlugs}
            totalCount={totalCount}
            onReady={handleReady}
          />

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleShare}
              disabled={generating}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Share2 className="h-4 w-4 mr-1.5" />
              {generating ? t("collection.shareCard.generating") : t("collection.shareCard.share")}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={generating}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-1.5" />
              {t("collection.shareCard.download")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function downloadBlob(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `pokopia-collection-${Date.now()}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
