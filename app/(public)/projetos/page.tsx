'use client'

import { motion } from 'framer-motion'
import { ImageIcon } from 'lucide-react'

export default function ProjetosPage() {
  return (
    <div className="min-h-screen bg-vultrix-black py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Projetos
          </h1>
          <p className="text-xl text-vultrix-light/70 max-w-3xl mx-auto mb-12">
            Conheça alguns dos projetos desenvolvidos com tecnologia Vultrix
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-16 text-center">
            <div className="bg-vultrix-accent/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="text-vultrix-accent" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Galeria em Construção
            </h2>
            <p className="text-vultrix-light/70 mb-8">
              Em breve você poderá conferir nosso portfólio completo de projetos realizados.
              Estamos preparando conteúdo exclusivo para você.
            </p>
            <div className="inline-block px-6 py-3 bg-vultrix-gray text-vultrix-light/50 rounded-lg text-sm font-medium">
              Disponível em breve
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
