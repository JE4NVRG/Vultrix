'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Printer, Box, Zap, ArrowRight } from 'lucide-react'

export default function Home() {
  const features = [
    {
      icon: Printer,
      title: 'Impressão 3D',
      description: 'Alta precisão e qualidade em cada projeto'
    },
    {
      icon: Box,
      title: 'Prototipagem',
      description: 'Transforme ideias em protótipos funcionais'
    },
    {
      icon: Zap,
      title: 'Produtos Personalizados',
      description: 'Soluções customizadas para suas necessidades'
    }
  ]

  return (
    <div className="min-h-screen bg-vultrix-black">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Vultrix <span className="text-vultrix-accent">3D</span>
          </h1>
          <p className="text-2xl md:text-3xl text-vultrix-light/80 mb-12 font-light">
            Tecnologia que vira forma.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contato"
              className="px-8 py-4 bg-vultrix-accent text-white rounded-lg font-semibold hover:bg-vultrix-accent/90 transition-all hover:scale-105"
            >
              Solicitar Orçamento
            </Link>
            <Link
              href="/projetos"
              className="px-8 py-4 bg-vultrix-gray text-white rounded-lg font-semibold hover:bg-vultrix-gray/80 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              Ver Projetos
              <ArrowRight size={20} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-8 hover:border-vultrix-accent transition-all hover:scale-105"
            >
              <div className="bg-vultrix-accent/10 w-14 h-14 rounded-lg flex items-center justify-center mb-6">
                <feature.icon className="text-vultrix-accent" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-vultrix-light/70">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-vultrix-dark to-vultrix-gray border border-vultrix-accent/30 rounded-2xl p-12 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pronto para começar seu projeto?
          </h2>
          <p className="text-vultrix-light/70 mb-8 max-w-2xl mx-auto">
            Entre em contato e transforme suas ideias em realidade com tecnologia de impressão 3D de alta qualidade.
          </p>
          <Link
            href="/contato"
            className="inline-block px-8 py-4 bg-vultrix-accent text-white rounded-lg font-semibold hover:bg-vultrix-accent/90 transition-all hover:scale-105"
          >
            Falar com a Equipe
          </Link>
        </motion.div>
      </section>
    </div>
  )
}
