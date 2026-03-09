import type { Metadata } from "next"
import { WishlistPage } from "@/components/pages/wishlist-page"
import { getPageAlternates } from "@/i18n/config"

export const metadata: Metadata = {
  title: "Wishlist",
  description:
    "Your saved Pokémon, recipes, habitats, and materials.",
  alternates: getPageAlternates("en", "/wishlist"),
  robots: { index: false, follow: true },
}

export default function Page() {
  return <WishlistPage locale="en" />
}
