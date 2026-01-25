'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Play, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Youtube,
  Instagram,
  Mail
} from 'lucide-react'

export default function CursosPage() {
  const tutoriais = [
    {
      title: 'Como precificar impressões 3D',
      description: 'Aprenda a calcular custos e definir preços que dão lucro real.',
      duration: '15 min',
      free: true
    },
    {
      title: 'Configurando sua primeira impressora',
      description: 'Setup inicial, nivelamento e primeira impressão de teste.',
      duration: '20 min',
      free: true
    },
    {
      title: 'Entendendo materiais: PLA, PETG, TPU',
      description: 'Quando usar cada material e como configurar no slicer.',
      duration: '25 min',
      free: true
    },
    {
      title: 'Slicer avançado: suportes e preenchimento',
      description: 'Otimize suas impressões com configurações profissionais.',
      duration: '30 min',
      free: false
    }
  ]

  return (
    <div className="min-h-screen bg-vultrix-black py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 text-sm font-medium mb-6">
            <GraduationCap size={16} />
            Aprenda impressão 3D
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Cursos & Tutoriais
          </h1>
          <p className="text-xl text-vultrix-light/70 max-w-2xl mx-auto">
            Conteúdo gratuito para você dominar a impressão 3D e lucrar com seu hobby
          </p>
        </motion.div>

        {/* Tutoriais em desenvolvimento */}
        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Play className="text-vultrix-accent" size={24} />
              Tutoriais Disponíveis
            </h2>
            
            <div className="space-y-4">
              {tutoriais.map((tutorial, index) => (
                <motion.div
                  key={tutorial.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6 hover:border-vultrix-accent/50 transition-all flex items-center gap-4"
                >
                  <div className="bg-vultrix-accent/10 p-3 rounded-lg flex-shrink-0">
                    <Play className="text-vultrix-accent" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1">{tutorial.title}</h3>
                    <p className="text-vultrix-light/60 text-sm">{tutorial.description}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1 text-vultrix-light/50 text-sm">
                      <Clock size={14} />
                      {tutorial.duration}
                    </div>
                    {tutorial.free ? (
                      <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded">
                        Grátis
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs font-medium rounded">
                        Em breve
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Cards de tipo de conteúdo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-8"
            >
              <div className="bg-vultrix-accent/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="text-vultrix-accent" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Cursos Online
              </h3>
              <p className="text-vultrix-light/70 text-sm mb-4">
                Conteúdo estruturado do básico ao avançado. Vídeo-aulas, exercícios práticos 
                e certificado de conclusão.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-vultrix-light/60 text-sm">
                  <CheckCircle className="text-green-400" size={14} />
                  Acesso vitalício
                </li>
                <li className="flex items-center gap-2 text-vultrix-light/60 text-sm">
                  <CheckCircle className="text-green-400" size={14} />
                  Suporte por comunidade
                </li>
                <li className="flex items-center gap-2 text-vultrix-light/60 text-sm">
                  <CheckCircle className="text-green-400" size={14} />
                  Atualizações gratuitas
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-8"
            >
              <div className="bg-purple-500/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <Users className="text-purple-400" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Mentoria Individual
              </h3>
              <p className="text-vultrix-light/70 text-sm mb-4">
                Acompanhamento 1:1 para acelerar sua jornada. Ideal para quem quer 
                transformar impressão 3D em negócio.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-vultrix-light/60 text-sm">
                  <CheckCircle className="text-purple-400" size={14} />
                  Calls semanais
                </li>
                <li className="flex items-center gap-2 text-vultrix-light/60 text-sm">
                  <CheckCircle className="text-purple-400" size={14} />
                  Análise de projetos
                </li>
                <li className="flex items-center gap-2 text-vultrix-light/60 text-sm">
                  <CheckCircle className="text-purple-400" size={14} />
                  Suporte por WhatsApp
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Newsletter / Avise-me */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-vultrix-accent/20 to-purple-500/20 border border-vultrix-accent/30 rounded-2xl p-8 text-center mt-12"
          >
            <h2 className="text-2xl font-bold text-white mb-3">
              Quer ser avisado quando lançarmos?
            </h2>
            <p className="text-vultrix-light/70 mb-6">
              Siga-nos nas redes sociais para receber novidades sobre cursos e conteúdos gratuitos.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://instagram.com/vultrix3d"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition-all"
              >
                <Instagram size={18} />
                @vultrix3d
              </a>
              <a
                href="https://youtube.com/@vultrix3d"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:opacity-90 transition-all"
              >
                <Youtube size={18} />
                YouTube
              </a>
              <Link
                href="/contato"
                className="flex items-center gap-2 px-6 py-3 bg-vultrix-gray text-white rounded-lg font-medium hover:bg-vultrix-gray/80 transition-all"
              >
                <Mail size={18} />
                Contato
              </Link>
            </div>
          </motion.div>

          {/* CTA Ferramenta */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-8 text-center mt-8"
          >
            <h3 className="text-xl font-bold text-white mb-3">
              Enquanto isso, use nossa ferramenta grátis!
            </h3>
            <p className="text-vultrix-light/70 mb-6">
              Calcule custos de impressão, defina preços e controle seus filamentos.
            </p>
            <Link
              href="/ferramenta"
              className="inline-flex items-center gap-2 px-6 py-3 bg-vultrix-accent text-white rounded-lg font-semibold hover:bg-vultrix-accent/90 transition-all"
            >
              Acessar Ferramenta
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
