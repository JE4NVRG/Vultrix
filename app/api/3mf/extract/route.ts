import { NextRequest, NextResponse } from "next/server";
import AdmZip from "adm-zip";

interface Material {
  slot_index: number;
  material_type: string;
  color_name: string;
  color_hex: string;
  weight_grams: number;
}

interface ExtractedData {
  name: string;
  estimated_time_minutes: number | null;
  total_weight_grams: number | null;
  materials: Material[];
  thumbnail_base64: string | null;
  debug: {
    files: string[];
  };
}

/**
 * Extrai metadados de um arquivo .3mf do Bambu Studio
 * O .3mf é um arquivo ZIP contendo modelos 3D e metadados
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo foi enviado" },
        { status: 400 },
      );
    }

    if (!file.name.toLowerCase().endsWith(".3mf")) {
      return NextResponse.json(
        { error: "O arquivo deve ter extensão .3mf" },
        { status: 400 },
      );
    }

    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Abrir o ZIP
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();

    // Debug: listar todos os arquivos
    const fileList = zipEntries.map((entry) => entry.entryName);
    console.log("📁 Arquivos no .3mf:", fileList);
    console.log("📊 Total de arquivos:", fileList.length);

    // Variáveis para armazenar dados extraídos
    let projectName = file.name.replace(".3mf", "");
    let estimatedTimeMinutes: number | null = null;
    let totalWeightGrams: number | null = null;
    let thumbnailBase64: string | null = null;
    const materials: Material[] = [];

    // Procurar por metadados
    for (const entry of zipEntries) {
      try {
        const entryName = entry.entryName.toLowerCase();

        // Ignorar diretórios
        if (entry.isDirectory) continue;

        console.log(`\n🔍 Processando: ${entry.entryName}`);

        // Extrair thumbnail (primeira imagem encontrada)
        if (
          !thumbnailBase64 &&
          (entryName.includes("thumbnail") ||
            entryName.includes("cover") ||
            (entryName.includes("picture") &&
              !entryName.includes("profile"))) &&
          (entryName.endsWith(".png") ||
            entryName.endsWith(".jpg") ||
            entryName.endsWith(".jpeg") ||
            entryName.endsWith(".webp"))
        ) {
          try {
            const imageBuffer = entry.getData();
            thumbnailBase64 = `data:image/${entryName.split(".").pop()};base64,${imageBuffer.toString("base64")}`;
            console.log(`   🖼️ Thumbnail encontrado: ${entry.entryName}`);
          } catch (imgError) {
            console.log(`   ⚠️ Erro ao ler imagem: ${imgError}`);
          }
        }

        // Ler conteúdo do arquivo (pode falhar se for binário)
        let content: string;
        try {
          content = entry.getData().toString("utf8");
          console.log(`   ✅ Tamanho: ${content.length} caracteres`);

          // Só mostrar preview se não for imagem
          if (
            !entryName.includes("picture") &&
            !entryName.includes(".webp") &&
            !entryName.includes(".png")
          ) {
            console.log(
              `   📄 Preview (primeiros 200 chars):\n   ${content.substring(0, 200)}`,
            );
          } else {
            console.log(`   🖼️ Arquivo de imagem, pulando preview`);
          }
        } catch (readError) {
          console.log(`   ⚠️ Não foi possível ler como texto, pulando...`);
          continue;
        }

        // Procurar por arquivos de metadados do Bambu Studio
        // Incluir .gcode, .3mf, e arquivos dentro de Metadata/
        const isRelevantFile =
          entryName.includes("metadata") ||
          entryName.includes("config") ||
          entryName.includes("plate_") ||
          entryName.includes("3dmodel.model") ||
          entryName.includes("slice_info") ||
          entryName.endsWith(".json") ||
          entryName.endsWith(".xml") ||
          entryName.endsWith(".gcode") ||
          entryName.endsWith(".3mf");

        if (isRelevantFile) {
          console.log(`   💡 Arquivo relevante detectado!`);

          // ===== BUSCAR TEMPO DE IMPRESSÃO =====
          console.log(`   🔎 Buscando tempo de impressão...`);
          const timePatterns = [
            // GCode comments
            /;\s*estimated printing time.*?=\s*(\d+)h?\s*(\d+)?m?/i,
            /;\s*time\s*=\s*(\d+)/i,

            // JSON/XML patterns
            /print_time["\s:=]*(\d+)/i,
            /estimated_time["\s:=]*(\d+)/i,
            /normal_print_time["\s:=]*"?(\d+\.?\d*)[hms]?"?/i,
            /"time"[:\s]*(\d+)/i,

            // Bambu Studio specific
            /<time>(\d+)<\/time>/i,
            /<print_time>(\d+)<\/print_time>/i,
            /PrintTime[:\s=]*(\d+)/i,

            // Format: "2h 45m" or "2h45m"
            /time[^>]*>?\s*(\d+)\s*h\s*(\d+)?\s*m/i,
          ];

          for (const pattern of timePatterns) {
            const match = content.match(pattern);
            if (match && estimatedTimeMinutes === null) {
              console.log(
                `   🎯 Match encontrado: ${match[0].substring(0, 100)}`,
              );
              // Verificar se tem horas e minutos separados
              if (match[2] !== undefined) {
                const hours = parseInt(match[1]) || 0;
                const minutes = parseInt(match[2]) || 0;
                estimatedTimeMinutes = hours * 60 + minutes;
              } else {
                const value = match[1];
                const num = parseFloat(value);

                // Se for maior que 1000, provavelmente está em segundos
                if (num > 1000) {
                  estimatedTimeMinutes = Math.round(num / 60);
                } else if (num > 0) {
                  // Se for menor, pode ser minutos ou horas
                  estimatedTimeMinutes = Math.round(num);
                }
              }

              if (estimatedTimeMinutes && estimatedTimeMinutes > 0) {
                console.log(
                  `   ✅ Tempo encontrado: ${estimatedTimeMinutes} minutos`,
                );
                break;
              } else {
                estimatedTimeMinutes = null; // Reset se for 0
              }
            }
          }

          if (!estimatedTimeMinutes) {
            console.log(`   ❌ Tempo não encontrado neste arquivo`);
          }

          // ===== BUSCAR PESO/FILAMENTO =====
          console.log(`   🔎 Buscando peso total...`);
          const weightPatterns = [
            // GCode comments
            /;\s*filament used.*?=\s*(\d+\.?\d*)\s*g/gi,
            /;\s*total filament.*?=\s*(\d+\.?\d*)/gi,

            // JSON/XML patterns
            /filament_used_g["\s:=]*"?(\d+\.?\d*)"?/gi,
            /total_filament["\s:=]*"?(\d+\.?\d*)"?/gi,
            /filament_weight["\s:=]*"?(\d+\.?\d*)"?/gi,
            /used_g["\s:=]*"?(\d+\.?\d*)"?/gi,

            // Bambu Studio specific
            /<filament_used_g>(\d+\.?\d*)<\/filament_used_g>/gi,
            /<weight>(\d+\.?\d*)<\/weight>/gi,
            /TotalFilament[:\s=]*(\d+\.?\d*)/gi,

            // Generic weight patterns
            /weight["\s:=]*(\d+\.?\d*)\s*g/gi,
          ];

          for (const pattern of weightPatterns) {
            const matches = Array.from(content.matchAll(pattern));
            if (matches.length > 0 && totalWeightGrams === null) {
              console.log(`   🎯 ${matches.length} match(es) encontrado(s)`);
              const sum = matches.reduce((acc, m) => acc + parseFloat(m[1]), 0);
              if (sum > 0) {
                totalWeightGrams = Math.round(sum * 100) / 100; // Arredondar para 2 decimais
                console.log(`   ✅ Peso encontrado: ${totalWeightGrams}g`);
                break;
              }
            }
          }

          if (!totalWeightGrams) {
            console.log(`   ❌ Peso não encontrado neste arquivo`);
          }

          // ===== BUSCAR MATERIAIS/AMS =====
          console.log(`   🔎 Buscando materiais...`);
          
          // Padrão 0: GCode header com filament length por cor (MAIS CONFIÁVEL)
          // ; total filament length [mm] : 10135.71,4742.24,4787.63
          if (materials.length === 0) {
            const filamentLengthMatch = content.match(/;\s*total filament length \[mm\]\s*:\s*([0-9.,\s]+)/i);
            if (filamentLengthMatch) {
              const lengths = filamentLengthMatch[1].split(',').map(l => parseFloat(l.trim())).filter(l => !isNaN(l) && l > 0);
              console.log(`   🎨 Encontrados ${lengths.length} filamentos por comprimento: ${lengths.join(', ')}mm`);
              
              // Converter mm para gramas (PLA 1.75mm: ~2.98g/m = 0.00298g/mm)
              const gramsPerMm = 0.00298;
              lengths.forEach((lengthMm, index) => {
                const weightG = Math.round(lengthMm * gramsPerMm * 100) / 100;
                materials.push({
                  slot_index: index + 1,
                  material_type: 'PLA',
                  color_name: `Cor ${index + 1}`,
                  color_hex: ['#FF5733', '#33FF57', '#3357FF', '#FFD700', '#FF33FF', '#33FFFF'][index] || '#CCCCCC',
                  weight_grams: weightG,
                });
              });
              
              // Também calcular peso total se não tiver
              if (totalWeightGrams === null && materials.length > 0) {
                totalWeightGrams = Math.round(materials.reduce((sum, m) => sum + m.weight_grams, 0) * 100) / 100;
                console.log(`   ✅ Peso total calculado: ${totalWeightGrams}g`);
              }
            }
          }
          
          // Padrão 1: Formato JSON completo do AMS
          const amsPattern =
            /"filament_id"[:\s]*"(\d+)"[^}]*"filament_type"[:\s]*"([^"]+)"[^}]*"filament_color"[:\s]*"([^"]+)"[^}]*"used_g"[:\s]*"?(\d+\.?\d*)"?/gi;
          const amsMatches = Array.from(content.matchAll(amsPattern));

          if (amsMatches.length > 0 && materials.length === 0) {
            console.log(`   🎨 Encontrados ${amsMatches.length} materiais (padrão AMS)`);
            amsMatches.forEach((match, index) => {
              const slotId = match[1];
              const materialType = match[2];
              const colorHex = match[3];
              const weightG = parseFloat(match[4]);

              if (weightG > 0) {
                materials.push({
                  slot_index: parseInt(slotId) || index,
                  material_type: materialType || "Unknown",
                  color_name: colorHex.toUpperCase(),
                  color_hex: colorHex.startsWith("#")
                    ? colorHex
                    : `#${colorHex}`,
                  weight_grams: weightG,
                });
              }
            });
          }

          // Padrão 2: filament_used_g e filament_colour arrays (Bambu Studio)
          if (materials.length === 0) {
            // Procurar arrays de peso por filamento
            const usedGMatch = content.match(/"filament_used_g"\s*:\s*\[([^\]]+)\]/i);
            const colorMatch = content.match(/"filament_colour"\s*:\s*\[([^\]]+)\]/i) ||
                               content.match(/"filament_color"\s*:\s*\[([^\]]+)\]/i);
            const typeMatch = content.match(/"filament_type"\s*:\s*\[([^\]]+)\]/i);
            
            if (usedGMatch) {
              const weights = usedGMatch[1].split(',').map(w => parseFloat(w.replace(/["'\s]/g, ''))).filter(w => !isNaN(w));
              const colors = colorMatch ? colorMatch[1].split(',').map(c => c.replace(/["'\s]/g, '').trim()) : [];
              const types = typeMatch ? typeMatch[1].split(',').map(t => t.replace(/["'\s]/g, '').trim()) : [];
              
              console.log(`   🎨 Encontrados ${weights.length} filamentos via arrays`);
              console.log(`      Pesos: ${weights.join(', ')}g`);
              console.log(`      Cores: ${colors.join(', ')}`);
              
              weights.forEach((weight, index) => {
                if (weight > 0) {
                  const color = colors[index] || '#CCCCCC';
                  materials.push({
                    slot_index: index + 1,
                    material_type: types[index] || 'PLA',
                    color_name: color.toUpperCase(),
                    color_hex: color.startsWith('#') ? color : `#${color}`,
                    weight_grams: weight,
                  });
                }
              });
            }
          }
          
          // Padrão 3: slice_info com plates (Bambu Studio)
          if (materials.length === 0 && content.includes('"plates"')) {
            try {
              const jsonMatch = content.match(/\{[\s\S]*"plates"[\s\S]*\}/);
              if (jsonMatch) {
                const sliceData = JSON.parse(jsonMatch[0]);
                if (sliceData.plates && Array.isArray(sliceData.plates)) {
                  sliceData.plates.forEach((plate: any) => {
                    if (plate.filaments && Array.isArray(plate.filaments)) {
                      plate.filaments.forEach((fil: any, idx: number) => {
                        const weight = parseFloat(fil.used_g) || parseFloat(fil.weight) || 0;
                        if (weight > 0) {
                          materials.push({
                            slot_index: fil.id || idx + 1,
                            material_type: fil.type || 'PLA',
                            color_name: fil.color || 'Desconhecido',
                            color_hex: fil.color_hex || '#CCCCCC',
                            weight_grams: weight,
                          });
                        }
                      });
                    }
                  });
                  console.log(`   🎨 Encontrados ${materials.length} materiais via plates`);
                }
              }
            } catch (e) {
              // Não é JSON válido
            }
          }

          // Procurar especificamente no projeto principal do Bambu
          if (
            entryName.includes("project.json") ||
            entryName === "3dbenchy.json"
          ) {
            try {
              const json = JSON.parse(content);

              // Nome do projeto
              if (json.name) projectName = json.name;

              // Tempo de impressão
              if (
                json.print_time !== undefined &&
                estimatedTimeMinutes === null
              ) {
                estimatedTimeMinutes = Math.round(json.print_time / 60);
              }
              if (
                json.estimated_time !== undefined &&
                estimatedTimeMinutes === null
              ) {
                estimatedTimeMinutes = Math.round(json.estimated_time / 60);
              }

              // Peso/filamento
              if (
                json.filament_used_g !== undefined &&
                totalWeightGrams === null
              ) {
                totalWeightGrams = json.filament_used_g;
              }
              if (
                json.total_weight !== undefined &&
                totalWeightGrams === null
              ) {
                totalWeightGrams = json.total_weight;
              }

              // Materiais
              if (json.filaments && Array.isArray(json.filaments)) {
                json.filaments.forEach((fil: any, idx: number) => {
                  materials.push({
                    slot_index: fil.id || idx,
                    material_type: fil.type || "Unknown",
                    color_name: fil.color || "Unknown",
                    color_hex: fil.color_hex || "#CCCCCC",
                    weight_grams: fil.used_g || 0,
                  });
                });
              }
            } catch (jsonError) {
              // Não é JSON válido, continuar
              console.log(`   (Não é JSON válido)`);
            }
          }
        } // Fecha o if (entryName.includes("metadata")...)
      } catch (entryError) {
        console.error(`❌ Erro ao processar ${entry.entryName}:`, entryError);
        // Continuar com próximo arquivo
        continue;
      }
    } // fim do for loop

    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMO DA EXTRAÇÃO:");
    console.log("=".repeat(60));
    console.log(`Nome: ${projectName}`);
    console.log(
      `Tempo: ${estimatedTimeMinutes ? `${estimatedTimeMinutes} minutos` : "❌ NÃO ENCONTRADO"}`,
    );
    console.log(
      `Peso: ${totalWeightGrams ? `${totalWeightGrams}g` : "❌ NÃO ENCONTRADO"}`,
    );
    console.log(`Materiais: ${materials.length}`);
    console.log("=".repeat(60) + "\n");

    // Se não encontrou materiais mas tem peso total, criar um material genérico
    if (materials.length === 0 && totalWeightGrams && totalWeightGrams > 0) {
      materials.push({
        slot_index: 0,
        material_type: "PLA",
        color_name: "Desconhecido",
        color_hex: "#CCCCCC",
        weight_grams: totalWeightGrams,
      });
    }

    const result: ExtractedData = {
      name: projectName,
      estimated_time_minutes: estimatedTimeMinutes,
      total_weight_grams: totalWeightGrams,
      materials,
      thumbnail_base64: thumbnailBase64,
      debug: {
        files: fileList,
      },
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erro ao processar .3mf:", error);
    return NextResponse.json(
      {
        error: "Erro ao processar arquivo .3mf",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
