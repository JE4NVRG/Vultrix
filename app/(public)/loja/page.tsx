'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Printer, 
  Package, 
  Wrench, 
  ExternalLink, 
  Star, 
  Sparkles,
  ThumbsUp,
  TrendingUp
} from 'lucide-react'

// Produtos afiliados - substitua os links pelos seus links de afiliado
const impressoras = [
  {
    id: 1,
    name: 'Creality K1C',
    description: 'Impressora CoreXY rápida com câmara fechada. Até 600mm/s. Ideal para produção.',
    price: 'R$ 2.799',
    originalPrice: 'R$ 3.299',
    rating: 4.9,
    reviews: 234,
    badge: 'Mais Vendida',
    affiliateLink: 'https://www.amazon.com.br/dp/B0XXXXXX?tag=vultrix3d-20',
    features: ['CoreXY 600mm/s', 'Câmara Fechada', 'Auto-nivelamento', 'Wi-Fi']
  },
  {
    id: 2,
    name: 'Bambu Lab P1S',
    description: 'Multi-cores com AMS. Print-and-forget com alta qualidade e confiabilidade.',
    price: 'R$ 4.999',
    originalPrice: 'R$ 5.499',
    rating: 4.8,
    reviews: 567,
    badge: 'Premium',
    affiliateLink: 'https://www.amazon.com.br/dp/B0XXXXXX?tag=vultrix3d-20',
    features: ['Multi-cores AMS', '500mm/s', 'Câmara Fechada', 'Lidar']
  },
  {
    id: 3,
    name: 'Creality Ender 3 V3 SE',
    description: 'Melhor custo-benefício para iniciantes. Fácil montagem e ótimos resultados.',
    price: 'R$ 899',
    originalPrice: 'R$ 1.199',
    rating: 4.6,
    reviews: 1234,
    badge: 'Iniciantes',
    affiliateLink: 'https://www.amazon.com.br/dp/B0XXXXXX?tag=vultrix3d-20',
    features: ['Auto-nivelamento', 'Direct Drive', 'Silenciosa', 'Fácil Setup']
  },
  {
    id: 4,
    name: 'Creality K1 Max',
    description: 'Grande volume de impressão (300x300x300mm) com velocidade CoreXY.',
    price: 'R$ 4.299',
    originalPrice: 'R$ 4.999',
    rating: 4.7,
    reviews: 189,
    badge: 'Grande Volume',
    affiliateLink: 'https://www.amazon.com.br/dp/B0XXXXXX?tag=vultrix3d-20',
    features: ['300x300x300mm', '600mm/s', 'Câmara Fechada', 'IA']
  }
]

const filamentos = [
  {
    id: 1,
    name: 'eSUN PLA+ Preto 1kg',
    description: 'PLA+ de alta qualidade. Ótima fluidez, acabamento fosco, resistente.',
    price: 'R$ 89',
    originalPrice: 'R$ 109',
    rating: 4.8,
    reviews: 892,
    badge: 'Best Seller',
    affiliateLink: 'https://www.amazon.com.br/dp/B0XXXXXX?tag=vultrix3d-20',
    colors: ['Preto', 'Branco', 'Cinza', '+15 cores']
  },
  {
    id: 2,
    name: '3D Lab PETG 1kg',
    description: 'PETG brasileiro de qualidade. Resistente a impacto e umidade.',
    price: 'R$ 119',
    originalPrice: 'R$ 149',
    rating: 4.7,
    reviews: 456,
    badge: 'Nacional',
    affiliateLink: 'https://www.amazon.com.br/dp/B0XXXXXX?tag=vultrix3d-20',
    colors: ['Transparente', 'Preto', 'Branco', '+10 cores']
  },
  {
    id: 3,
    name: 'Sunlu Silk PLA Rainbow',
    description: 'Efeito sedoso metalizado. Perfeito para peças decorativas.',
    price: 'R$ 99',
    originalPrice: 'R$ 129',
    rating: 4.6,
    reviews: 234,
    badge: 'Decorativo',
    affiliateLink: 'https://www.amazon.com.br/dp/B0XXXXXX?tag=vultrix3d-20',
    colors: ['Ouro', 'Prata', 'Bronze', 'Rainbow']
  },
  {
    id: 4,
    name: 'Polyterra PLA Matte',
    description: 'Ecológico, fácil de lixar, acabamento matte profissional.',
    price: 'R$ 139',
    originalPrice: 'R$ 169',
    rating: 4.9,
    reviews: 678,
    badge: 'Ecológico',
    affiliateLink: 'https://www.amazon.com.br/dp/B0XXXXXX?tag=vultrix3d-20',
    colors: ['Fossil Grey', 'Cotton White', 'Wood Brown']
  }
]

const acessorios = [
  {
    id: 1,
    name: 'Kit Espátulas Impressão 3D',
    description: 'Conjunto de espátulas profissionais para remoção de peças.',
    price: 'R$ 49',
    affiliateLink: 'https://www.amazon.com.br/dp/B0XXXXXX?tag=vultrix3d-20'
  },
  {
    id: 2,
    name: 'Secador de Filamento Sunlu S2',
    description: 'Seca e armazena filamentos. Essencial para PETG, Nylon e TPU.',
    price: 'R$ 299',
    affiliateLink: 'https://www.amazon.com.br/dp/B0XXXXXX?tag=vultrix3d-20'
  },
  {
    id: 3,
    name: 'Cola Bastão 3D (6un)',
    description: 'Aderência perfeita na mesa. Fácil remoção após esfriar.',
    price: 'R$ 29',
    affiliateLink: 'https://www.amazon.com.br/dp/B0XXXXXX?tag=vultrix3d-20'
  },
  {
    id: 4,
    name: 'Bico Hardened Steel 0.4mm',
    description: 'Bico de aço endurecido. Para filamentos abrasivos (madeira, carbono).',
    price: 'R$ 39',
    affiliateLink: 'https://www.amazon.com.br/dp/B0XXXXXX?tag=vultrix3d-20'
  },
  {
    id: 5,
    name: 'Desumidificador Portátil',
    description: 'Mantém seu espaço maker seco. Protege filamentos higroscópicos.',
    price: 'R$ 189',
    affiliateLink: 'https://www.amazon.com.br/dp/B0XXXXXX?tag=vultrix3d-20'
  },
  {
    id: 6,
    name: 'Kit Lixas P/Acabamento',
    description: 'Lixas d\'água 400 a 2000. Acabamento profissional em suas peças.',
    price: 'R$ 24',
    affiliateLink: 'https://www.amazon.com.br/dp/B0XXXXXX?tag=vultrix3d-20'
  }
]

export default function LojaPage() {
  return (
    <div className="min-h-screen bg-vultrix-black">
      {/* Hero */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm font-medium mb-6">
            <ThumbsUp size={16} />
            Produtos que recomendamos
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Equipamentos para <span className="text-vultrix-accent">Makers 3D</span>
          </h1>
          
          <p className="text-xl text-vultrix-light/70 mb-6">
            Selecionamos os melhores produtos para você começar ou expandir seu setup. 
            Todos testados e aprovados pela comunidade.
          </p>
          
          <p className="text-sm text-vultrix-light/50">
            * Links de afiliados. Comprando através deles você ajuda o Vultrix sem custo extra.
          </p>
        </motion.div>
      </section>

      {/* Impressoras */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="bg-vultrix-accent/10 p-3 rounded-lg">
            <Printer className="text-vultrix-accent" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Impressoras 3D</h2>
            <p className="text-vultrix-light/60">As melhores opções para cada orçamento</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {impressoras.map((produto, index) => (
            <motion.div
              key={produto.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-vultrix-dark border border-vultrix-gray rounded-xl overflow-hidden hover:border-vultrix-accent/50 transition-all group"
            >
              {/* Imagem placeholder */}
              <div className="relative h-48 bg-gradient-to-br from-vultrix-gray to-vultrix-dark flex items-center justify-center">
                <Printer className="text-vultrix-accent/30" size={64} />
                {produto.badge && (
                  <span className="absolute top-3 left-3 px-2 py-1 bg-vultrix-accent text-white text-xs font-bold rounded">
                    {produto.badge}
                  </span>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-bold text-white mb-1">{produto.name}</h3>
                <p className="text-vultrix-light/60 text-sm mb-3 line-clamp-2">{produto.description}</p>
                
                <div className="flex items-center gap-1 mb-3">
                  <Star className="text-yellow-400 fill-yellow-400" size={14} />
                  <span className="text-white text-sm font-medium">{produto.rating}</span>
                  <span className="text-vultrix-light/50 text-xs">({produto.reviews})</span>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {produto.features.map((feature) => (
                    <span key={feature} className="px-2 py-0.5 bg-vultrix-gray text-vultrix-light/70 text-xs rounded">
                      {feature}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-vultrix-light/50 text-sm line-through">{produto.originalPrice}</span>
                    <span className="text-green-400 font-bold ml-2">{produto.price}</span>
                  </div>
                  <a
                    href={produto.affiliateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-vultrix-accent text-white text-sm rounded-lg hover:bg-vultrix-accent/80 transition-all flex items-center gap-1"
                  >
                    Ver <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Filamentos */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="bg-purple-500/10 p-3 rounded-lg">
            <Package className="text-purple-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Filamentos</h2>
            <p className="text-vultrix-light/60">PLA, PETG, TPU e materiais especiais</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filamentos.map((produto, index) => (
            <motion.div
              key={produto.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-vultrix-dark border border-vultrix-gray rounded-xl overflow-hidden hover:border-purple-500/50 transition-all"
            >
              {/* Imagem placeholder */}
              <div className="relative h-40 bg-gradient-to-br from-purple-500/20 to-vultrix-dark flex items-center justify-center">
                <Package className="text-purple-400/30" size={48} />
                {produto.badge && (
                  <span className="absolute top-3 left-3 px-2 py-1 bg-purple-500 text-white text-xs font-bold rounded">
                    {produto.badge}
                  </span>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-bold text-white mb-1">{produto.name}</h3>
                <p className="text-vultrix-light/60 text-sm mb-3 line-clamp-2">{produto.description}</p>
                
                <div className="flex items-center gap-1 mb-3">
                  <Star className="text-yellow-400 fill-yellow-400" size={14} />
                  <span className="text-white text-sm font-medium">{produto.rating}</span>
                  <span className="text-vultrix-light/50 text-xs">({produto.reviews})</span>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {produto.colors.map((color) => (
                    <span key={color} className="px-2 py-0.5 bg-vultrix-gray text-vultrix-light/70 text-xs rounded">
                      {color}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-vultrix-light/50 text-sm line-through">{produto.originalPrice}</span>
                    <span className="text-green-400 font-bold ml-2">{produto.price}</span>
                  </div>
                  <a
                    href={produto.affiliateLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-500/80 transition-all flex items-center gap-1"
                  >
                    Ver <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Acessórios */}
      <section className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="flex items-center gap-3 mb-8"
        >
          <div className="bg-orange-500/10 p-3 rounded-lg">
            <Wrench className="text-orange-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Acessórios Essenciais</h2>
            <p className="text-vultrix-light/60">Ferramentas e consumíveis para seu setup</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {acessorios.map((produto, index) => (
            <motion.a
              key={produto.id}
              href={produto.affiliateLink}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="bg-vultrix-dark border border-vultrix-gray rounded-xl p-4 hover:border-orange-500/50 transition-all flex items-center gap-4 group"
            >
              <div className="bg-orange-500/10 p-3 rounded-lg flex-shrink-0">
                <Wrench className="text-orange-400" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-sm mb-1">{produto.name}</h3>
                <p className="text-vultrix-light/60 text-xs line-clamp-1">{produto.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-green-400 font-bold">{produto.price}</span>
                <ExternalLink className="text-vultrix-light/40 group-hover:text-orange-400 transition-colors mt-1 ml-auto" size={14} />
              </div>
            </motion.a>
          ))}
        </div>
      </section>

      {/* CTA para Ferramenta */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-vultrix-accent/20 to-purple-500/20 border border-vultrix-accent/30 rounded-2xl p-8 md:p-12 text-center"
        >
          <Sparkles className="text-vultrix-accent mx-auto mb-4" size={40} />
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Calcule o custo das suas impressões
          </h2>
          <p className="text-vultrix-light/70 mb-6 max-w-xl mx-auto">
            Com o Vultrix você sabe exatamente quanto custa cada peça, 
            quanto cobrar e qual seu lucro real.
          </p>
          <Link
            href="/ferramenta"
            className="inline-flex items-center gap-2 px-8 py-4 bg-vultrix-accent text-white rounded-lg font-bold hover:bg-vultrix-accent/90 transition-all hover:scale-105"
          >
            <TrendingUp size={20} />
            Experimente Grátis
          </Link>
        </motion.div>
      </section>

      {/* Disclaimer */}
      <section className="container mx-auto px-4 py-8">
        <div className="text-center text-vultrix-light/40 text-xs max-w-2xl mx-auto">
          <p>
            Esta página contém links de afiliados. Quando você compra através desses links, 
            podemos receber uma comissão sem custo adicional para você. 
            Isso nos ajuda a manter o Vultrix3D funcionando. Obrigado pelo apoio!
          </p>
        </div>
      </section>
    </div>
  )
}
