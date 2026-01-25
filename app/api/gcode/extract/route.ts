import { NextRequest, NextResponse } from "next/server";
import { parseGCode } from "@/lib/utils/parseGcode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/gcode/extract
 * Recebe arquivo .gcode e retorna metadados extraídos
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 },
      );
    }

    // Validar extensão
    if (!file.name.toLowerCase().endsWith(".gcode")) {
      return NextResponse.json(
        { error: "Arquivo deve ser .gcode" },
        { status: 400 },
      );
    }

    // Ler conteúdo
    const arrayBuffer = await file.arrayBuffer();
    const content = new TextDecoder("utf-8").decode(arrayBuffer);

    // Parse
    const parseResult = parseGCode(content);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Não foi possível extrair informações do GCode",
          details: parseResult.errors,
        },
        { status: 400 },
      );
    }

    // Retornar dados no formato esperado pelo frontend
    return NextResponse.json({
      success: true,
      name: file.name.replace(".gcode", ""),
      estimated_time_minutes: parseResult.estimated_time_minutes,
      total_weight_grams: parseResult.total_weight_grams,
      materials: parseResult.materials,
      print_settings: parseResult.print_settings,
      slicer_name: parseResult.slicer_name,
      slicer_version: parseResult.slicer_version,
    });
  } catch (error: any) {
    console.error("❌ Erro ao processar GCode:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar arquivo", details: error.message },
      { status: 500 },
    );
  }
}
