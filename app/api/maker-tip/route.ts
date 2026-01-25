import { NextRequest, NextResponse } from 'next/server'

// Cache simples em memória para evitar chamadas excessivas
let cachedTip: { tip: string; date: string } | null = null

export async function GET(request: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Retorna cache se for do mesmo dia
    if (cachedTip && cachedTip.date === today) {
      return NextResponse.json({ tip: cachedTip.tip, cached: true })
    }

    // Gera nova dica via OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente especializado em impressão 3D e negócios maker. 
Gere UMA dica curta e prática (máximo 2 frases) para makers que vendem impressões 3D.
A dica deve ser sobre um destes temas (alterne):
- Precificação e margem de lucro
- Qualidade de impressão
- Gestão de filamentos
- Atendimento ao cliente
- Produtividade
- Marketing para makers
- Controle financeiro

Seja direto, motivacional e prático. Use emojis com moderação.`
          },
          {
            role: 'user',
            content: 'Gere a dica do dia para makers 3D.'
          }
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
    })

    if (!response.ok) {
      throw new Error('OpenAI API error')
    }

    const data = await response.json()
    const tip = data.choices?.[0]?.message?.content || 'Continue focado no seu negócio maker! 🚀'
    
    // Atualiza cache
    cachedTip = { tip, date: today }

    return NextResponse.json({ tip, cached: false })
  } catch (error: any) {
    console.error('Erro ao gerar dica:', error)
    
    // Retorna dica padrão em caso de erro
    const defaultTips = [
      '💡 Sempre calcule seus custos antes de definir o preço. Margem saudável = negócio sustentável!',
      '🎯 Responda seus clientes em até 2 horas. Agilidade gera confiança e mais vendas!',
      '📦 Mantenha seu estoque de filamentos organizado. Saber o que tem evita paradas na produção.',
      '💰 Separe pelo menos 20% do lucro para reinvestir no negócio.',
      '⚡ Otimize seu slicer! Pequenos ajustes podem reduzir tempo de impressão em até 30%.',
      '🌟 Peça avaliações aos clientes satisfeitos. Prova social vende mais que qualquer anúncio!',
    ]
    
    const randomTip = defaultTips[Math.floor(Math.random() * defaultTips.length)]
    
    return NextResponse.json({ tip: randomTip, cached: false, fallback: true })
  }
}
