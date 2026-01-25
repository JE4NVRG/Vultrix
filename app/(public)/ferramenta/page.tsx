'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Calculator, 
  Layers, 
  Clock, 
  DollarSign, 
  BarChart3, 
  Zap, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  TrendingUp,
  Package,
  FileCode
} from 'lucide-react'

export default function FerramentaPage() {
  const features = [
    {
      icon: FileCode,
      title: 'Importação Inteligente',
      description: 'Faça upload de arquivos .3mf ou .gcode e extraia tempo, peso e materiais automaticamente.'
    },
    {
      icon: Calculator,
      title: 'Cálculo de Custos Precisos',
      description: 'Material, energia, embalagem, frete, taxas de marketplace - tudo calculado automaticamente.'
    },
    {
      icon: TrendingUp,
      title: 'Margem Profissional',
      description: 'Fórmula correta: Preço = Custo ÷ (1 - taxas% - margem%). Nunca mais perca dinheiro!'
    },
    {
      icon: Layers,
      title: 'Multi-filamentos',
      description: 'Suporte a projetos com múltiplos filamentos e cores. Calcule o custo real de prints multicoloridos.'
    },
    {
      icon: BarChart3,
      title: 'Controle Financeiro',
      description: 'Dashboard completo com vendas, despesas, lucro e fluxo de caixa do seu negócio.'
    },
    {
      icon: Package,
      title: 'Gestão de Estoque',
      description: 'Controle seus filamentos, saiba quanto tem de cada cor e quando precisa repor.'
    }
  ]

  const benefits = [
    'Calcule preços em segundos',
    'Nunca mais venda no prejuízo',
    'Organize seus filamentos',
    'Controle suas impressoras',
    'Acompanhe vendas e lucros',
    'Relatórios detalhados'
  ]

  const plans = [
    {
      name: 'Grátis',
      price: 'R$ 0',
      period: '/mês',
      description: 'Para começar',
      features: [
        'Calculadora de custos',
        'Até 3 filamentos',
        'Até 10 produtos',
        '1 impressora',
        'Suporte por email'
      ],
      cta: 'Começar Grátis',
      href: '/login',
      popular: false
    },
    {
      name: 'Maker',
      price: 'R$ 29',
      period: '/mês',
      description: 'Para makers ativos',
      features: [
        'Tudo do Grátis +',
        'Filamentos ilimitados',
        'Produtos ilimitados',
        'Até 5 impressoras',
        'Controle financeiro',
        'Dashboard completo',
        'Suporte prioritário'
      ],
      cta: 'Testar 14 dias grátis',
      href: '/login',
      popular: true
    },
    {
      name: 'Pro',
      price: 'R$ 59',
      period: '/mês',
      description: 'Para negócios',
      features: [
        'Tudo do Maker +',
        'Impressoras ilimitadas',
        'Relatórios avançados',
        'Exportação de dados',
        'API de integração',
        'Multi-usuários',
        'Suporte VIP'
      ],
      cta: 'Falar com vendas',
      href: '/contato',
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-vultrix-black">
      {/* Hero */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-vultrix-accent/10 border border-vultrix-accent/30 rounded-full text-vultrix-accent text-sm font-medium mb-6">
            <Sparkles size={16} />
            Sistema completo para makers 3D
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Calcule custos, precifique e{' '}
            <span className="text-vultrix-accent">lucre de verdade</span>
          </h1>
          
          <p className="text-xl text-vultrix-light/70 mb-8 max-w-2xl mx-auto">
            A ferramenta que todo maker 3D precisa. Importe seu arquivo, calcule o custo real 
            e defina o preço certo para nunca mais vender no prejuízo.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 bg-vultrix-accent text-white rounded-lg font-semibold hover:bg-vultrix-accent/90 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <Zap size={20} />
              Experimente Grátis
            </Link>
            <a
              href="#como-funciona"
              className="px-8 py-4 bg-vultrix-gray text-white rounded-lg font-semibold hover:bg-vultrix-gray/80 transition-all flex items-center justify-center gap-2"
            >
              Ver como funciona
              <ArrowRight size={20} />
            </a>
          </div>
          
          <p className="text-sm text-vultrix-light/50 mt-4">
            ✓ Sem cartão de crédito &nbsp; ✓ Começa em 30 segundos
          </p>
        </motion.div>
      </section>

      {/* Demo Video/Screenshot */}
      <section className="container mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="bg-gradient-to-br from-vultrix-dark to-vultrix-gray border border-vultrix-accent/30 rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Importe → Calcule → Venda
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-vultrix-light/80">
                    <span className="text-vultrix-accent font-bold">1.</span>
                    Faça upload do arquivo .3mf ou .gcode
                  </li>
                  <li className="flex items-start gap-3 text-vultrix-light/80">
                    <span className="text-vultrix-accent font-bold">2.</span>
                    O sistema extrai tempo, peso e materiais
                  </li>
                  <li className="flex items-start gap-3 text-vultrix-light/80">
                    <span className="text-vultrix-accent font-bold">3.</span>
                    Adicione custos extras (frete, embalagem, taxas)
                  </li>
                  <li className="flex items-start gap-3 text-vultrix-light/80">
                    <span className="text-vultrix-accent font-bold">4.</span>
                    Defina sua margem e veja o preço ideal
                  </li>
                </ul>
              </div>
              <div className="bg-vultrix-black/50 rounded-xl p-6 border border-vultrix-gray">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-vultrix-light/70">Material</span>
                    <span className="text-white font-mono">R$ 8,50</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-vultrix-light/70">Energia (4.5h)</span>
                    <span className="text-white font-mono">R$ 0,68</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-vultrix-light/70">Embalagem</span>
                    <span className="text-white font-mono">R$ 2,00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-vultrix-light/70">Frete</span>
                    <span className="text-white font-mono">R$ 22,00</span>
                  </div>
                  <div className="border-t border-vultrix-gray pt-4 flex justify-between items-center">
                    <span className="text-red-400 font-semibold">Custo Total</span>
                    <span className="text-red-400 font-mono font-bold">R$ 33,18</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-vultrix-light/70">Taxas (20%)</span>
                    <span className="text-yellow-400 font-mono">- R$ 22,12</span>
                  </div>
                  <div className="border-t border-green-500/30 pt-4 flex justify-between items-center bg-green-500/10 -mx-6 px-6 py-3 rounded-lg">
                    <span className="text-green-400 font-bold">Preço Sugerido (50%)</span>
                    <span className="text-green-400 font-mono font-bold text-xl">R$ 110,60</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-300">Lucro líquido</span>
                    <span className="text-green-300 font-mono font-bold">R$ 55,30</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="como-funciona" className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Tudo que você precisa em um lugar
          </h2>
          <p className="text-vultrix-light/70 max-w-2xl mx-auto">
            Desenvolvido por makers, para makers. Cada funcionalidade foi pensada 
            para resolver problemas reais do dia a dia.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
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
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-vultrix-light/70 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-vultrix-accent/10 to-purple-500/10 border border-vultrix-accent/30 rounded-2xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">
                Por que makers escolhem o Vultrix?
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="text-green-400 flex-shrink-0" size={18} />
                    <span className="text-vultrix-light/80 text-sm">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="text-center">
              <div className="inline-block bg-vultrix-dark rounded-xl p-8 border border-vultrix-gray">
                <p className="text-vultrix-light/70 mb-2">Mais de</p>
                <p className="text-5xl font-bold text-vultrix-accent mb-2">500+</p>
                <p className="text-vultrix-light/70">makers já usam</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Planos para cada momento
          </h2>
          <p className="text-vultrix-light/70 max-w-2xl mx-auto">
            Comece grátis e evolua conforme seu negócio cresce
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`bg-vultrix-dark border rounded-xl p-6 relative ${
                plan.popular 
                  ? 'border-vultrix-accent scale-105' 
                  : 'border-vultrix-gray'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-vultrix-accent text-white text-xs font-bold rounded-full">
                  MAIS POPULAR
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-vultrix-light/50 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-vultrix-light/50">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-vultrix-light/80">
                    <CheckCircle className="text-green-400 flex-shrink-0" size={16} />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`block w-full py-3 rounded-lg font-semibold text-center transition-all ${
                  plan.popular
                    ? 'bg-vultrix-accent text-white hover:bg-vultrix-accent/90'
                    : 'bg-vultrix-gray text-white hover:bg-vultrix-gray/80'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-vultrix-accent to-purple-600 rounded-2xl p-12 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Comece agora, é grátis!
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Crie sua conta em segundos e comece a calcular custos corretamente. 
            Sem cartão, sem compromisso.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-vultrix-accent rounded-lg font-bold hover:bg-white/90 transition-all hover:scale-105"
          >
            <Zap size={20} />
            Criar conta grátis
          </Link>
        </motion.div>
      </section>
    </div>
  )
}
