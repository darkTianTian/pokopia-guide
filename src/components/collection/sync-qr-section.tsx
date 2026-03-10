"use client"

import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { encodeCollection, buildSyncUrl } from "@/lib/collection-sync"

interface SyncQrSectionProps {
  caughtSlugs: ReadonlySet<string>
  orderedSlugs: readonly string[]
  translations: Record<string, string>
}

export function SyncQrSection({
  caughtSlugs,
  orderedSlugs,
  translations,
}: SyncQrSectionProps) {
  const [open, setOpen] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const t = (key: string) => translations[key] ?? key

  useEffect(() => {
    if (!open || caughtSlugs.size === 0) return

    const encoded = encodeCollection(caughtSlugs, orderedSlugs)
    const url = buildSyncUrl(encoded)

    QRCode.toDataURL(url, {
      width: 280,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "L",
    }).then(setQrDataUrl).catch(() => setQrDataUrl(null))
  }, [open, caughtSlugs, orderedSlugs])

  if (caughtSlugs.size === 0) return null

  return (
    <>
      <div className="border-t border-border/40 pt-4">
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="w-full rounded-full border-border/50 bg-background/50 backdrop-blur-sm shadow-sm transition-all duration-300"
        >
          <QrCode className="h-4 w-4 mr-1.5" />
          {t("collection.sync.title")}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xs border-border/40 bg-background/80 backdrop-blur-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <QrCode className="h-5 w-5" />
              {t("collection.sync.title")}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {t("collection.sync.description")}
            </DialogDescription>
          </DialogHeader>
          {qrDataUrl && (
            <div className="flex justify-center">
              <div className="rounded-lg border border-border/50 bg-white p-2 shadow-sm">
                <img
                  src={qrDataUrl}
                  alt="Sync QR Code"
                  width={240}
                  height={240}
                  className="block"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
