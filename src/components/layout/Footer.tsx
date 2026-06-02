import Link from "next/link";
import { LinkIcon, ExternalLinkIcon, CodeIcon, ServerIcon } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative border-t border-primary/20 mt-auto">
      <div className="absolute inset-0 bg-bg-surface/60 backdrop-blur-sm" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 bg-linear-to-br from-primary to-secondary rounded-lg opacity-90" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <LinkIcon className="w-4 h-4 text-white" />
                </div>
              </div>
              <span className="font-display font-bold text-xl text-text-primary">
                Chain<span className="gradient-text">Vote</span>
              </span>
            </Link>
            <p className="text-sm text-text-muted leading-relaxed">
              Platform voting transparan berbasis smart contract Hardhat lokal. Setiap suara tercatat di blockchain — tidak dapat dimanipulasi.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                title="GitHub"
                className="p-2 rounded-lg bg-bg-card border border-primary/20 hover:border-primary/20 text-text-muted hover:text-text-primary transition-all"
              >
                <CodeIcon className="w-4 h-4" />
              </a>
              <span
                title="Hardhat Local Node"
                className="p-2 rounded-lg bg-bg-card border border-primary/20 text-text-muted"
              >
                <ServerIcon className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-text-primary font-display uppercase tracking-wider">
              Platform
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "Landing", href: "/" },
                { label: "Kandidat", href: "/candidates" },
                { label: "Voting", href: "/vote" },
                { label: "Hasil", href: "/results" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-text-muted hover:text-text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Akun */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-text-primary font-display uppercase tracking-wider">
              Akun
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "Daftar", href: "/register" },
                { label: "Login", href: "/login" },
                { label: "Dashboard", href: "/dashboard" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-text-muted hover:text-text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Blockchain */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-text-primary font-display uppercase tracking-wider">
              Blockchain
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: "Hardhat", href: "https://hardhat.org" },
                { label: "MetaMask", href: "https://metamask.io" },
                { label: "Ethereum Docs", href: "https://ethereum.org" },
              ].map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors"
                  >
                    {item.label}
                    <ExternalLinkIcon className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-8 border-t border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-muted">
            © 2025 ChainVote. Dibuat untuk transparansi demokrasi digital.
          </p>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-success inline-block animate-pulse" />
            <span>Berjalan di</span>
            <span className="text-primary">Hardhat Localhost</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
