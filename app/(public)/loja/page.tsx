'use client'

import { motion } from 'framer-motion'
import { ShoppingBag, Package, FileCode } from 'lucide-react'

export default function LojaPage() {
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
            Loja Vultrix
          </h1>
          <p className="text-xl text-vultrix-light/70 max-w-3xl mx-auto">
            Produtos exclusivos e arquivos STL
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
              <ShoppingBag className="text-vultrix-accent" size={48} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Em Construção
            </h2>
            <p className="text-vultrix-light/70 mb-8 text-lg">
              Em breve você terá acesso à nossa loja online com produtos prontos,
              kits personalizados e biblioteca de arquivos STL.
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
                <Package className="text-vultrix-accent" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Produtos Prontos
              </h3>
              <p className="text-vultrix-light/70 text-sm">
                Peças e produtos finalizados, prontos para envio. Qualidade garantida
                e acabamento profissional.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-8"
            >
              <div className="bg-vultrix-accent/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                <FileCode className="text-vultrix-accent" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Arquivos STL
              </h3>
              <p className="text-vultrix-light/70 text-sm">
                Downloads de modelos 3D exclusivos para você imprimir em sua própria
                impressora. Designs únicos e otimizados.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
