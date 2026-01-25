import Link from 'next/link'
import { Instagram, Mail, Youtube, Sparkles } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-vultrix-dark border-t border-vultrix-gray mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Vultrix <span className="text-vultrix-accent">3D</span>
            </h3>
            <p className="text-vultrix-light/70 text-sm mb-4">
              Tecnologia que vira forma.
            </p>
            <Link
              href="/ferramenta"
              className="inline-flex items-center gap-2 text-vultrix-accent text-sm hover:underline"
            >
              <Sparkles size={14} />
              Calculadora Grátis
            </Link>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Serviços</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/servicos" className="text-vultrix-light/70 hover:text-vultrix-accent transition-colors">
                  Impressão 3D
                </Link>
              </li>
              <li>
                <Link href="/servicos" className="text-vultrix-light/70 hover:text-vultrix-accent transition-colors">
                  Prototipagem
                </Link>
              </li>
              <li>
                <Link href="/contato" className="text-vultrix-light/70 hover:text-vultrix-accent transition-colors">
                  Orçamento
                </Link>
              </li>
            </ul>
          </div>

          {/* Para Makers */}
          <div>
            <h4 className="text-white font-semibold mb-4">Para Makers</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/ferramenta" className="text-vultrix-light/70 hover:text-vultrix-accent transition-colors">
                  Ferramenta de Custos
                </Link>
              </li>
              <li>
                <Link href="/loja" className="text-vultrix-light/70 hover:text-vultrix-accent transition-colors">
                  Equipamentos
                </Link>
              </li>
              <li>
                <Link href="/cursos" className="text-vultrix-light/70 hover:text-vultrix-accent transition-colors">
                  Tutoriais
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-vultrix-light/70 hover:text-vultrix-accent transition-colors">
                  Acessar Dashboard
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
                href="https://youtube.com/@vultrix3d"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-vultrix-light/70 hover:text-red-400 transition-colors text-sm"
              >
                <Youtube size={18} />
                <span>YouTube</span>
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

        <div className="border-t border-vultrix-gray mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-vultrix-light/50 text-sm">
              © {new Date().getFullYear()} Vultrix 3D. Todos os direitos reservados.
            </p>
            <p className="text-vultrix-light/40 text-xs text-center md:text-right">
              Alguns links podem ser de afiliados. Ao comprar através deles, você nos apoia sem custo extra.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
