'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Sparkles } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/servicos', label: 'Serviços' },
    { href: '/loja', label: 'Loja' },
    { href: '/contato', label: 'Contato' },
  ]

  const isActive = (path: string) => pathname === path

  return (
    <nav className="fixed top-0 w-full bg-vultrix-black/95 backdrop-blur-sm border-b border-vultrix-gray z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-white">
            Vultrix <span className="text-vultrix-accent">3D</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-vultrix-accent ${
                  isActive(link.href) ? 'text-vultrix-accent' : 'text-vultrix-light'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/ferramenta"
              className={`text-sm font-medium transition-colors hover:text-green-400 flex items-center gap-1 ${
                isActive('/ferramenta') ? 'text-green-400' : 'text-green-300'
              }`}
            >
              <Sparkles size={14} />
              Ferramenta
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-vultrix-accent text-white rounded-lg text-sm font-medium hover:bg-vultrix-accent/90 transition-colors"
            >
              Login
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`text-sm font-medium transition-colors hover:text-vultrix-accent ${
                    isActive(link.href) ? 'text-vultrix-accent' : 'text-vultrix-light'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/ferramenta"
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium transition-colors text-green-300 hover:text-green-400 flex items-center gap-1"
              >
                <Sparkles size={14} />
                Ferramenta Grátis
              </Link>
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-vultrix-accent text-white rounded-lg text-sm font-medium hover:bg-vultrix-accent/90 transition-colors text-center"
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
