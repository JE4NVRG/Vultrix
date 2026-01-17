'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Printer, Layers, Package } from 'lucide-react'

export default function ServicosPage() {
  const services = [
    {
      icon: Printer,
      title: 'Impressão 3D sob Demanda',
      description: 'Produção de peças e modelos com alta precisão e acabamento profissional. Diversos materiais disponíveis.',
      features: [
        'PLA, PETG, ABS e outros materiais',
        'Acabamento de alta qualidade',
        'Prazos flexíveis',
        'Consultoria técnica incluída'
      ]
    },
    {
      icon: Layers,
      title: 'Prototipagem Rápida',
      description: 'Desenvolvimento de protótipos funcionais para validação de conceitos e testes antes da produção final.',
      features: [
        'Iteração rápida de designs',
        'Validação de conceitos',
        'Testes funcionais',
        'Redução de custos de desenvolvimento'
      ]
    },
    {
      icon: Package,
      title: 'Produtos Personalizados',
      description: 'Criação de produtos únicos e personalizados para atender necessidades específicas do seu negócio.',
      features: [
        'Design customizado',
        'Branding e identidade',
        'Peças técnicas especiais',
        'Séries limitadas'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-vultrix-black py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Nossos Serviços
          </h1>
          <p className="text-xl text-vultrix-light/70 max-w-3xl mx-auto">
            Soluções completas em impressão 3D para transformar suas ideias em realidade
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="space-y-12">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-8 md:p-12 hover:border-vultrix-accent transition-all"
            >
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-shrink-0">
                  <div className="bg-vultrix-accent/10 w-20 h-20 rounded-xl flex items-center justify-center">
                    <service.icon className="text-vultrix-accent" size={40} />
                  </div>
                </div>
                
                <div className="flex-grow">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                    {service.title}
                  </h2>
                  <p className="text-vultrix-light/70 mb-6 text-lg">
                    {service.description}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {service.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <CheckCircle className="text-vultrix-accent flex-shrink-0 mt-1" size={18} />
                        <span className="text-vultrix-light/80 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-vultrix-light/60 text-sm">
            * Preços sob consulta. Entre em contato para um orçamento personalizado.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
