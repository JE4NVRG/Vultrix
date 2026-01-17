import Link from 'next/link'
import { Instagram, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-vultrix-dark border-t border-vultrix-gray mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Vultrix <span className="text-vultrix-accent">3D</span>
            </h3>
            <p className="text-vultrix-light/70 text-sm">
              Tecnologia que vira forma.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Links Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/servicos" className="text-vultrix-light/70 hover:text-vultrix-accent transition-colors">
                  Serviços
                </Link>
              </li>
              <li>
                <Link href="/projetos" className="text-vultrix-light/70 hover:text-vultrix-accent transition-colors">
                  Projetos
                </Link>
              </li>
              <li>
                <Link href="/cursos" className="text-vultrix-light/70 hover:text-vultrix-accent transition-colors">
                  Cursos
                </Link>
              </li>
              <li>
                <Link href="/contato" className="text-vultrix-light/70 hover:text-vultrix-accent transition-colors">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contato</h4>
            <div className="flex flex-col space-y-3">
              <a
                href="https://instagram.com/vultrix3d"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-vultrix-light/70 hover:text-vultrix-accent transition-colors text-sm"
              >
                <Instagram size={18} />
                <span>@vultrix3d</span>
              </a>
              <a
                href="mailto:contato@vultrix3d.com.br"
                className="flex items-center space-x-2 text-vultrix-light/70 hover:text-vultrix-accent transition-colors text-sm"
              >
                <Mail size={18} />
                <span>contato@vultrix3d.com.br</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-vultrix-gray mt-8 pt-8 text-center">
          <p className="text-vultrix-light/50 text-sm">
            © {new Date().getFullYear()} Vultrix 3D. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
