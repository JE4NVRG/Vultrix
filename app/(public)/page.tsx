'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Printer, 
  Box, 
  Zap, 
  ArrowRight, 
  Calculator, 
  TrendingUp, 
  Package, 
  BarChart3, 
  ShoppingBag, 
  Sparkles,
  CheckCircle,
  Play
} from 'lucide-react'

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

  const toolFeatures = [
    {
      icon: Calculator,
      title: 'Calculadora de Custos',
      description: 'Calcule o custo real de cada impressão incluindo material, energia e tempo.'
    },
    {
      icon: TrendingUp,
      title: 'Precificação Correta',
      description: 'Fórmula profissional: Preço = Custo ÷ (1 - taxas% - margem%). Lucre de verdade!'
    },
    {
      icon: Package,
      title: 'Gestão de Filamentos',
      description: 'Controle seu estoque de filamentos, cores e quantidades disponíveis.'
    },
    {
      icon: BarChart3,
      title: 'Controle Financeiro',
      description: 'Dashboard completo com vendas, despesas e fluxo de caixa do negócio.'
    }
  ]

  const benefits = [
    'Importa arquivos .3mf e .gcode',
    'Extrai tempo e peso automaticamente',
    'Calcula taxas de marketplace',
    'Suporte a multi-filamentos',
    'Controle de impressoras',
    '100% gratuito para começar'
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
          <p className="text-2xl md:text-3xl text-vultrix-light/80 mb-6 font-light">
            Tecnologia que vira forma.
          </p>
          <p className="text-lg text-vultrix-light/60 mb-12 max-w-2xl mx-auto">
            Serviços de impressão 3D profissional e ferramentas para makers 
            precificarem corretamente e lucrarem de verdade.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/ferramenta"
              className="px-8 py-4 bg-vultrix-accent text-white rounded-lg font-semibold hover:bg-vultrix-accent/90 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <Sparkles size={20} />
              Experimente Grátis
            </Link>
            <Link
              href="/servicos"
              className="px-8 py-4 bg-vultrix-gray text-white rounded-lg font-semibold hover:bg-vultrix-gray/80 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              Nossos Serviços
              <ArrowRight size={20} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Ferramenta Destaque */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-vultrix-accent/10 to-purple-500/10 border border-vultrix-accent/30 rounded-2xl overflow-hidden"
        >
          <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-vultrix-accent/20 rounded-full text-vultrix-accent text-sm font-medium mb-6">
                <Play size={16} />
                Ferramenta para Makers
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Calcule custos e precifique como um profissional
              </h2>
              <p className="text-vultrix-light/70 mb-6">
                Faça upload do seu arquivo .3mf ou .gcode, extraia tempo e peso automaticamente, 
                adicione custos extras e descubra o preço ideal para lucrar de verdade.
              </p>
              
              <div className="grid grid-cols-2 gap-3 mb-8">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="text-green-400 flex-shrink-0" size={16} />
                    <span className="text-vultrix-light/80 text-sm">{benefit}</span>
                  </motion.div>
                ))}
              </div>
              
              <Link
                href="/ferramenta"
                className="inline-flex items-center gap-2 px-6 py-3 bg-vultrix-accent text-white rounded-lg font-semibold hover:bg-vultrix-accent/90 transition-all"
              >
                <Calculator size={18} />
                Acessar Calculadora Grátis
              </Link>
            </div>
            
            {/* Demo visual */}
            <div className="bg-vultrix-dark/50 rounded-xl p-6 border border-vultrix-gray">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-vultrix-light/70">Peso do material</span>
                  <span className="text-white font-mono">85g</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-vultrix-light/70">Tempo de impressão</span>
                  <span className="text-white font-mono">4h 30min</span>
                </div>
                <div className="border-t border-vultrix-gray pt-4 flex justify-between items-center text-sm">
                  <span className="text-vultrix-light/70">Material (PLA)</span>
                  <span className="text-white font-mono">R$ 8,50</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-vultrix-light/70">Energia elétrica</span>
                  <span className="text-white font-mono">R$ 0,68</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-vultrix-light/70">Embalagem + Frete</span>
                  <span className="text-white font-mono">R$ 24,00</span>
                </div>
                <div className="border-t border-vultrix-gray pt-4 flex justify-between items-center">
                  <span className="text-red-400 font-semibold">Custo Total</span>
                  <span className="text-red-400 font-mono font-bold">R$ 33,18</span>
                </div>
                <div className="bg-green-500/10 -mx-6 px-6 py-4 rounded-lg border border-green-500/30">
                  <div className="flex justify-between items-center">
                    <span className="text-green-400 font-bold">Preço Sugerido (50%)</span>
                    <span className="text-green-400 font-mono font-bold text-xl">R$ 110,60</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <span className="text-green-300/70">Seu lucro líquido</span>
                    <span className="text-green-300 font-mono">R$ 55,30</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features da Ferramenta */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Tudo que você precisa para precificar
          </h2>
          <p className="text-vultrix-light/60 max-w-2xl mx-auto">
            Desenvolvido por makers, para makers. Cada funcionalidade resolve um problema real.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {toolFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-6 hover:border-vultrix-accent/50 transition-all"
            >
              <div className="bg-vultrix-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="text-vultrix-accent" size={24} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-vultrix-light/70 text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Serviços de Impressão 3D
          </h2>
          <p className="text-vultrix-light/60 max-w-2xl mx-auto">
            Oferecemos serviços profissionais de impressão 3D para empresas e pessoas físicas.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              viewport={{ once: true }}
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
        
        <div className="text-center mt-8">
          <Link
            href="/servicos"
            className="inline-flex items-center gap-2 text-vultrix-accent hover:underline"
          >
            Ver todos os serviços <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Loja Afiliados */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-vultrix-dark border border-vultrix-gray rounded-2xl p-8 md:p-12"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <div className="bg-green-500/10 p-4 rounded-xl">
                <ShoppingBag className="text-green-400" size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Equipamentos Recomendados</h3>
                <p className="text-vultrix-light/60">
                  Impressoras, filamentos e acessórios que usamos e recomendamos
                </p>
              </div>
            </div>
            <Link
              href="/loja"
              className="px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-500/90 transition-all flex items-center gap-2 flex-shrink-0"
            >
              Ver Produtos
              <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-vultrix-accent to-purple-600 rounded-2xl p-12 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pronto para lucrar de verdade?
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Crie sua conta gratuitamente e comece a calcular o preço correto das suas impressões. 
            Sem cartão de crédito, sem compromisso.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/ferramenta"
              className="px-8 py-4 bg-white text-vultrix-accent rounded-lg font-bold hover:bg-white/90 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <Sparkles size={20} />
              Começar Agora - É Grátis
            </Link>
            <Link
              href="/contato"
              className="px-8 py-4 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              Solicitar Orçamento de Impressão
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
