'use client'

import { motion } from 'framer-motion'
import { GraduationCap, BookOpen, Users } from 'lucide-react'

export default function CursosPage() {
  return (
    <div className="min-h-screen bg-vultrix-black py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Cursos & Mentoria
          </h1>
          <p className="text-xl text-vultrix-light/70 max-w-3xl mx-auto">
            Conhecimento aplicado à impressão 3D
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-12 text-center"
          >
            <div className="bg-vultrix-accent/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
              <GraduationCap className="text-vultrix-accent" size={48} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Em Construção
            </h2>
            <p className="text-vultrix-light/70 mb-8 text-lg">
              Estamos desenvolvendo um programa completo de cursos e mentorias para compartilhar
              conhecimento sobre impressão 3D, desde o básico até técnicas avançadas.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-8"
            >
              <div className="bg-vultrix-accent/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="text-vultrix-accent" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Cursos Online
              </h3>
              <p className="text-vultrix-light/70 text-sm">
                Material didático completo, vídeo-aulas e suporte direto para você dominar
                a impressão 3D no seu ritmo.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-8"
            >
              <div className="bg-vultrix-accent/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <Users className="text-vultrix-accent" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Mentoria Individual
              </h3>
              <p className="text-vultrix-light/70 text-sm">
                Acompanhamento personalizado para projetos específicos e desenvolvimento
                de habilidades técnicas avançadas.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
