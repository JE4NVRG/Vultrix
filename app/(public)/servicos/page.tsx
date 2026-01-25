'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  CheckCircle, 
  Printer, 
  Layers, 
  Package, 
  ArrowRight, 
  Clock, 
  Shield, 
  Truck,
  Sparkles,
  MessageCircle
} from 'lucide-react'

export default function ServicosPage() {
  const services = [
    {
      icon: Printer,
      title: 'Impressão 3D sob Demanda',
      description: 'Produção de peças e modelos com alta precisão e acabamento profissional. Diversos materiais disponíveis.',
      features: [
        'PLA, PETG, ABS, TPU e outros materiais',
        'Acabamento de alta qualidade',
        'Prazos flexíveis',
        'Consultoria técnica incluída'
      ],
      price: 'A partir de R$ 20/peça'
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
      ],
      price: 'Orçamento sob consulta'
    },
    {
      icon: Package,
      title: 'Produtos Personalizados',
      description: 'Criação de produtos únicos e personalizados para atender necessidades específicas do seu negócio.',
      features: [
        'Design customizado',
        'Branding e identidade',
        'Peças técnicas especiais',
        'Séries limitadas e produção'
      ],
      price: 'Orçamento sob consulta'
    }
  ]

  const benefits = [
    {
      icon: Clock,
      title: 'Entrega Rápida',
      description: 'Prazos competitivos para não atrasar seu projeto'
    },
    {
      icon: Shield,
      title: 'Qualidade Garantida',
      description: 'Rigoroso controle de qualidade em cada peça'
    },
    {
      icon: Truck,
      title: 'Envio Nacional',
      description: 'Enviamos para todo o Brasil com rastreamento'
    },
    {
      icon: MessageCircle,
      title: 'Suporte Dedicado',
      description: 'Atendimento rápido e personalizado'
    }
  ]

  const process = [
    {
      step: '1',
      title: 'Envie seu projeto',
      description: 'Mande seu arquivo 3D ou descreva sua ideia'
    },
    {
      step: '2',
      title: 'Receba o orçamento',
      description: 'Analisamos e enviamos proposta detalhada'
    },
    {
      step: '3',
      title: 'Aprovação',
      description: 'Confirme e inicie a produção'
    },
    {
      step: '4',
      title: 'Receba em casa',
      description: 'Peça pronta enviada com segurança'
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-vultrix-accent/10 border border-vultrix-accent/30 rounded-full text-vultrix-accent text-sm font-medium mb-6">
            <Printer size={16} />
            Serviços profissionais
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Impressão 3D Profissional
          </h1>
          <p className="text-xl text-vultrix-light/70 max-w-2xl mx-auto">
            Transforme suas ideias em realidade com nossa tecnologia de impressão 3D
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="space-y-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-8 md:p-10 hover:border-vultrix-accent/50 transition-all"
            >
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-shrink-0">
                  <div className="bg-vultrix-accent/10 w-16 h-16 rounded-xl flex items-center justify-center">
                    <service.icon className="text-vultrix-accent" size={32} />
                  </div>
                </div>
                
                <div className="flex-grow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <h2 className="text-2xl font-bold text-white">
                      {service.title}
                    </h2>
                    <span className="text-vultrix-accent font-semibold">
                      {service.price}
                    </span>
                  </div>
                  <p className="text-vultrix-light/70 mb-6">
                    {service.description}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {service.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <CheckCircle className="text-green-400 flex-shrink-0 mt-0.5" size={16} />
                        <span className="text-vultrix-light/80 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Como funciona */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Como funciona
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {process.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="bg-vultrix-accent text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-vultrix-light/60 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6 text-center"
              >
                <div className="bg-vultrix-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="text-vultrix-accent" size={24} />
                </div>
                <h3 className="font-bold text-white mb-1">{benefit.title}</h3>
                <p className="text-vultrix-light/60 text-xs">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="bg-gradient-to-r from-vultrix-accent/20 to-purple-500/20 border border-vultrix-accent/30 rounded-2xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Pronto para começar seu projeto?
                </h2>
                <p className="text-vultrix-light/70">
                  Entre em contato para um orçamento personalizado e sem compromisso.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/contato"
                  className="px-6 py-3 bg-vultrix-accent text-white rounded-lg font-semibold hover:bg-vultrix-accent/90 transition-all flex items-center gap-2"
                >
                  Solicitar Orçamento
                  <ArrowRight size={18} />
                </Link>
                <a
                  href="https://wa.me/5511999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-500/90 transition-all flex items-center gap-2"
                >
                  <MessageCircle size={18} />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Ferramenta CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-vultrix-light/60 mb-4">
            É maker e quer calcular seus próprios preços?
          </p>
          <Link
            href="/ferramenta"
            className="inline-flex items-center gap-2 text-vultrix-accent hover:underline"
          >
            <Sparkles size={16} />
            Experimente nossa calculadora grátis
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
