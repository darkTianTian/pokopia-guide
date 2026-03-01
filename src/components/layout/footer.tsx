import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <h3 className="mb-3 font-semibold">Pokopia 攻略站</h3>
            <p className="text-sm text-muted-foreground">
              最全面的 Pokopia 游戏攻略与数据查询平台。
            </p>
          </div>
          <div>
            <h3 className="mb-3 font-semibold">导航</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/pokedex"
                  className="text-muted-foreground hover:text-foreground"
                >
                  宝可梦图鉴
                </Link>
              </li>
              <li>
                <Link
                  href="/guides"
                  className="text-muted-foreground hover:text-foreground"
                >
                  攻略文章
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-semibold">关于</h3>
            <p className="text-sm text-muted-foreground">
              本站为玩家社区驱动的非官方攻略站。
            </p>
          </div>
        </div>
        <Separator className="my-6" />
        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Pokopia 攻略站. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
