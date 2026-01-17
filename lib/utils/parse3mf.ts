"use client";

/**
 * Parser para arquivos .3mf do Bambu Studio
 * Extrai informações de tempo de impressão e consumo de materiais
 */

export type Material3mf = {
  id: string;
  name: string;
  color: string;
  type: string; // PLA, PETG, ABS, etc
  weight: number; // em gramas
  ams_slot?: number; // slot do AMS (1-4)
};

export type ProjectData3mf = {
  name: string;
  totalTime: number; // em horas
  totalWeight: number; // em gramas
  materials: Material3mf[];
  plateNumber?: number;
  thumbnailBase64?: string;
};

/**
 * Parse .3mf file e extrai dados do projeto
 */
export async function parse3mfFile(file: File): Promise<ProjectData3mf> {
  try {
    // .3mf é um arquivo ZIP
    const arrayBuffer = await file.arrayBuffer();

    // Usar JSZip para extrair
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Extrair project.xml (contém metadados principais)
    const projectXml = await zip.file("Metadata/project.xml")?.async("text");

    // Extrair slice_info.config (contém dados de impressão do Bambu Studio)
    const sliceInfo = await zip
      .file("Metadata/slice_info.config")
      ?.async("text");

    // Extrair model.gcode.3mf (metadados adicionais)
    const modelFile = await zip.file(/.*\.model$/)?.[0]?.async("text");

    if (!projectXml && !sliceInfo && !modelFile) {
      throw new Error(
        "Arquivo .3mf inválido ou não contém metadados esperados",
      );
    }

    // Parse XML/JSON data
    const projectData = parseProjectMetadata(
      projectXml || "",
      sliceInfo || "",
      modelFile || "",
    );

    // Nome do arquivo sem extensão
    const fileName = file.name.replace(/\.3mf$/i, "");

    return {
      name: projectData.name || fileName,
      totalTime: projectData.totalTime,
      totalWeight: projectData.totalWeight,
      materials: projectData.materials,
      plateNumber: projectData.plateNumber,
      thumbnailBase64: projectData.thumbnailBase64,
    };
  } catch (error) {
    console.error("Erro ao fazer parse do .3mf:", error);
    throw new Error(
      "Falha ao processar arquivo .3mf. Verifique se o arquivo é válido.",
    );
  }
}

/**
 * Parse metadados do projeto
 */
function parseProjectMetadata(
  projectXml: string,
  sliceInfo: string,
  modelFile: string,
): ProjectData3mf {
  const materials: Material3mf[] = [];
  let totalTime = 0;
  let totalWeight = 0;
  let projectName = "";

  // Parse slice_info.config (JSON do Bambu Studio)
  if (sliceInfo) {
    try {
      const sliceData = JSON.parse(sliceInfo);

      // Tempo de impressão (em segundos, converter para horas)
      if (sliceData.print_time) {
        totalTime = sliceData.print_time / 3600;
      } else if (sliceData.estimated_time) {
        totalTime = sliceData.estimated_time / 3600;
      }

      // Nome do projeto
      projectName = sliceData.project_name || sliceData.title || "";

      // Materiais/Filamentos usados
      if (sliceData.filament_ids && Array.isArray(sliceData.filament_ids)) {
        sliceData.filament_ids.forEach((filamentId: string, index: number) => {
          const filamentType = sliceData.filament_type?.[index] || "PLA";
          const filamentColor = sliceData.filament_color?.[index] || "#FFFFFF";
          const filamentUsed = sliceData.filament_used_g?.[index] || 0;

          if (filamentUsed > 0) {
            materials.push({
              id: `mat_${index}`,
              name: `Filamento ${index + 1}`,
              color: convertColorToName(filamentColor),
              type: filamentType,
              weight: filamentUsed,
              ams_slot: index + 1,
            });
            totalWeight += filamentUsed;
          }
        });
      }
    } catch (e) {
      console.warn("Não foi possível fazer parse do slice_info.config", e);
    }
  }

  // Fallback: tentar extrair do XML se não conseguiu do JSON
  if (materials.length === 0 && projectXml) {
    try {
      // Parse básico de XML (sem dependências)
      const timeMatch = projectXml.match(/<time[^>]*>([^<]+)<\/time>/i);
      if (timeMatch) {
        totalTime = parseFloat(timeMatch[1]) / 3600;
      }

      const weightMatch = projectXml.match(/<weight[^>]*>([^<]+)<\/weight>/i);
      if (weightMatch) {
        totalWeight = parseFloat(weightMatch[1]);
      }

      // Nome do projeto
      const nameMatch = projectXml.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (nameMatch) {
        projectName = nameMatch[1];
      }
    } catch (e) {
      console.warn("Não foi possível fazer parse do project.xml", e);
    }
  }

  // Se não encontrou materiais, criar um genérico
  if (materials.length === 0 && totalWeight > 0) {
    materials.push({
      id: "mat_0",
      name: "Filamento Principal",
      color: "Não especificado",
      type: "PLA",
      weight: totalWeight,
      ams_slot: 1,
    });
  }

  return {
    name: projectName,
    totalTime: Math.max(0.1, totalTime), // mínimo 0.1h
    totalWeight,
    materials,
  };
}

/**
 * Converter código de cor hex para nome aproximado
 */
function convertColorToName(hexColor: string): string {
  const colorMap: { [key: string]: string } = {
    "#FFFFFF": "Branco",
    "#000000": "Preto",
    "#FF0000": "Vermelho",
    "#00FF00": "Verde",
    "#0000FF": "Azul",
    "#FFFF00": "Amarelo",
    "#FF6600": "Laranja",
    "#800080": "Roxo",
    "#FFC0CB": "Rosa",
    "#808080": "Cinza",
    "#964B00": "Marrom",
  };

  const upper = hexColor.toUpperCase();
  if (colorMap[upper]) {
    return colorMap[upper];
  }

  // Aproximação simples
  const hex = upper.replace("#", "");
  if (hex.length === 6) {
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    if (r > 200 && g > 200 && b > 200) return "Branco";
    if (r < 50 && g < 50 && b < 50) return "Preto";
    if (r > g && r > b) return "Vermelho";
    if (g > r && g > b) return "Verde";
    if (b > r && b > g) return "Azul";
  }

  return "Personalizada";
}

/**
 * Validar se arquivo é .3mf válido
 */
export function validate3mfFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!file) {
    return { valid: false, error: "Nenhum arquivo selecionado" };
  }

  if (!file.name.toLowerCase().endsWith(".3mf")) {
    return { valid: false, error: "Arquivo deve ter extensão .3mf" };
  }

  if (file.size > 100 * 1024 * 1024) {
    // 100MB
    return { valid: false, error: "Arquivo muito grande (máximo 100MB)" };
  }

  return { valid: true };
}
