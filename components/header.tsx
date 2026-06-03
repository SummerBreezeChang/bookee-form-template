import Link from "next/link"
import { Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SELF_DEPLOY_GITHUB_URL } from "@/lib/setup-packages"

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#integration", label: "Integration" },
  { href: "#demo", label: "Try Demo" },
]

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="px-6 md:px-12 lg:px-20">
        <div className="mx-auto flex h-22 max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/images/bookee-logo.png" alt="Bookee" className="h-7 w-auto" />
          </Link>

          <nav className="hidden items-center gap-8 font-mono text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground md:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
                {link.label}
              </a>
            ))}
          </nav>

          <Button asChild size="sm" className="font-mono text-xs uppercase tracking-wider">
            <a href={SELF_DEPLOY_GITHUB_URL} target="_blank" rel="noreferrer">
              <Github className="mr-1.5 h-4 w-4" />
              Get it on GitHub
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}
