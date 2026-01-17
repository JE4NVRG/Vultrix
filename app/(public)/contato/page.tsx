'use client'

import { motion } from 'framer-motion'
import { Mail, Instagram, MessageCircle } from 'lucide-react'

export default function ContatoPage() {
  const contacts = [
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      value: '+55 (11) 99999-9999',
      link: 'https://wa.me/5511999999999',
      description: 'Atendimento rápido e direto'
    },
    {
      icon: Instagram,
      title: 'Instagram',
      value: '@vultrix3d',
      link: 'https://instagram.com/vultrix3d',
      description: 'Acompanhe nossos projetos'
    },
    {
      icon: Mail,
      title: 'E-mail',
      value: 'contato@vultrix3d.com.br',
      link: 'mailto:contato@vultrix3d.com.br',
      description: 'Orçamentos e parcerias'
    }
  ]

  return (
    <div className="min-h-screen bg-vultrix-black py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Entre em Contato
          </h1>
          <p className="text-xl text-vultrix-light/70 max-w-3xl mx-auto">
            Estamos prontos para transformar suas ideias em realidade
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {contacts.map((contact, index) => (
            <motion.a
              key={contact.title}
              href={contact.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-8 hover:border-vultrix-accent transition-all hover:scale-105 text-center group"
            >
              <div className="bg-vultrix-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-vultrix-accent/20 transition-colors">
                <contact.icon className="text-vultrix-accent" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {contact.title}
              </h3>
              <p className="text-vultrix-accent font-medium mb-3">
                {contact.value}
              </p>
              <p className="text-vultrix-light/60 text-sm">
                {contact.description}
              </p>
            </motion.a>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 max-w-2xl mx-auto bg-vultrix-dark border border-vultrix-gray rounded-xl p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-4">
            Horário de Atendimento
          </h2>
          <p className="text-vultrix-light/70">
            Segunda a Sexta: 9h às 18h<br />
            Sábado: 9h às 13h
          </p>
        </motion.div>
      </div>
    </div>
  )
}
