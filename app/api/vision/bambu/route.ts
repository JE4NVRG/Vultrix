import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Rota para extrair dados de impressão a partir de um screenshot do Bambu Studio (PNG/JPG)
export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    console.log("🔑 OPENAI_API_KEY presente:", !!apiKey);
    console.log("🔑 API Key (primeiros 10 chars):", apiKey?.substring(0, 10) + "...");
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY não configurada. Adicione no .env.local e reinicie o servidor." },
        { status: 500 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Envie um arquivo de imagem no campo 'file'" },
        { status: 400 },
      );
    }

    console.log("📸 Recebido arquivo:", (file as any).name || "imagem", "Tamanho:", file.size, "bytes", "Tipo:", file.type);

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = file.type || "image/png";

    console.log("📦 Base64 gerado, tamanho:", base64.length, "caracteres");

    // Prompt otimizado para Bambu Studio / Orca Slicer
    const prompt = `Analise esta captura de tela do Bambu Studio ou Orca Slicer.

EXTRAIA OS SEGUINTES DADOS:

1. TEMPO DE IMPRESSÃO: Procure por formatos como:
   - "1h 35m" ou "1h35m"
   - "01:35:00" 
   - "Estimated time: X:XX:XX"
   - Qualquer indicação de horas e minutos

2. PESO/GRAMAS: Procure por:
   - "XXg" ou "XX.XX g"
   - "Filament: XXg"
   - Valores em gramas no painel de estatísticas

3. MATERIAIS/CORES (se AMS ou multi-cor):
   - Nome do filamento (PLA, PETG, etc.)
   - Cor (se identificável)
   - Peso por cor

Retorne SOMENTE um JSON válido:
{
  "total_time_hours": 1.58,
  "total_weight_grams": 58.65,
  "materials": [
    {"name": "PLA", "color": "Vermelho", "weight_grams": 30.5},
    {"name": "PLA", "color": "Preto", "weight_grams": 28.15}
  ],
  "notes": "qualquer observação relevante"
}

REGRAS:
- Converta tempo para horas decimais (1h30min = 1.5)
- Use números, não strings
- Se só houver 1 cor, crie 1 material
- Se não encontrar um dado, use 0
- NÃO invente dados que não estão na imagem`;

    // Usar gpt-4o para melhor capacidade de visão
    const modelId = process.env.OPENAI_VISION_MODEL || "gpt-4o";
    console.log("🤖 Usando modelo:", modelId);

    // Formato para Chat Completions API com vision
    const payload = {
      model: modelId,
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: prompt 
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.1
    };

    console.log("📤 Enviando para OpenAI Chat Completions...");
    console.log("📤 Modelo:", payload.model);

    const openaiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    console.log("📥 Status da resposta:", openaiRes.status);

    if (!openaiRes.ok) {
      const errTxt = await openaiRes.text();
      console.error("❌ Erro OpenAI:", openaiRes.status, errTxt);
      
      // Tentar com gpt-4o-mini se gpt-4o falhar (modelo pode não estar disponível)
      if (openaiRes.status === 404 || openaiRes.status === 400 || openaiRes.status === 401) {
        console.log("🔄 Tentando com gpt-4o-mini...");
        payload.model = "gpt-4o-mini";
        
        const retryRes = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          },
        );
        
        if (!retryRes.ok) {
          const retryErr = await retryRes.text();
          console.error("❌ Erro no retry:", retryRes.status, retryErr);
          return NextResponse.json(
            { error: "Falha na chamada OpenAI", details: retryErr, status: retryRes.status },
            { status: 502 },
          );
        }
        
        const retryCompletion = await retryRes.json();
        const retryContent = retryCompletion?.choices?.[0]?.message?.content;
        console.log("📥 Resposta do retry:", retryContent);
        
        return processResponse(retryContent);
      }
      
      return NextResponse.json(
        { error: "Falha na chamada OpenAI", details: errTxt, status: openaiRes.status },
        { status: 502 },
      );
    }

    const completion = await openaiRes.json();
    const rawContent = completion?.choices?.[0]?.message?.content;
    
    console.log("📥 Resposta bruta da OpenAI:", rawContent);
    
    return processResponse(rawContent);
    
  } catch (error: any) {
    console.error("❌ Erro em /api/vision/bambu:", error);
    return NextResponse.json(
      { error: error?.message || "Erro interno", stack: error?.stack },
      { status: 500 },
    );
  }
}

function processResponse(rawContent: string | null | undefined) {
  if (!rawContent) {
    return NextResponse.json(
      { error: "Resposta vazia da OpenAI" },
      { status: 502 },
    );
  }

  // Tentar extrair JSON da resposta (pode vir com markdown ```json...```)
  let jsonString = rawContent;
  
  // Remover blocos de código markdown
  const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonString = jsonMatch[1].trim();
  }
  
  // Tentar encontrar JSON em qualquer lugar do texto
  const jsonStartIndex = jsonString.indexOf('{');
  const jsonEndIndex = jsonString.lastIndexOf('}');
  if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
    jsonString = jsonString.substring(jsonStartIndex, jsonEndIndex + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    console.error("❌ JSON inválido:", jsonString);
    return NextResponse.json(
      { 
        error: "OpenAI retornou JSON inválido", 
        raw: rawContent,
        attempted: jsonString
      },
      { status: 502 },
    );
  }

  // Validar e normalizar os dados
  const result = {
    total_time_hours: parseFloat(parsed.total_time_hours) || 0,
    total_weight_grams: parseFloat(parsed.total_weight_grams) || 0,
    materials: Array.isArray(parsed.materials) ? parsed.materials.map((m: any) => ({
      name: m.name || "Filamento",
      color: m.color || "Desconhecida",
      weight_grams: parseFloat(m.weight_grams) || 0
    })) : [],
    notes: parsed.notes || "",
    plate: parsed.plate || null
  };

  // Se não houver materiais mas houver peso, criar um material genérico
  if (result.materials.length === 0 && result.total_weight_grams > 0) {
    result.materials = [{
      name: "PLA",
      color: "Padrão",
      weight_grams: result.total_weight_grams
    }];
  }

  console.log("✅ Dados extraídos com sucesso:", JSON.stringify(result, null, 2));

  return NextResponse.json(result);
}
