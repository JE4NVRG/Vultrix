export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      filament_brands: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          name: string;
          website: string | null;
          logo_url: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          name: string;
          website?: string | null;
          logo_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          name?: string;
          website?: string | null;
          logo_url?: string | null;
        };
      };
      filaments: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          nome: string;
          marca: string;
          tipo: string;
          cor: string;
          custo_por_kg: number;
          peso_inicial: number;
          peso_atual: number;
          data_compra: string;
          brand_id: string | null;
          color_name: string | null;
          color_hex: string;
          image_url: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          nome: string;
          marca: string;
          tipo: string;
          cor: string;
          custo_por_kg: number;
          peso_inicial?: number;
          peso_atual: number;
          data_compra: string;
          brand_id?: string | null;
          color_name?: string | null;
          color_hex?: string;
          image_url?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          nome?: string;
          marca?: string;
          tipo?: string;
          cor?: string;
          custo_por_kg?: number;
          peso_inicial?: number;
          peso_atual?: number;
          data_compra?: string;
          brand_id?: string | null;
          color_name?: string | null;
          color_hex?: string;
          image_url?: string | null;
          notes?: string | null;
        };
      };
      expenses: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          categoria: string;
          descricao: string;
          valor: number;
          data: string;
          recorrente: boolean;
          category_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          categoria: string;
          descricao: string;
          valor: number;
          data: string;
          recorrente?: boolean;
          category_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          categoria?: string;
          descricao?: string;
          valor?: number;
          data?: string;
          recorrente?: boolean;
          category_id?: string | null;
        };
      };
      products: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          project_id: string | null;
          filamento_id: string | null;
          nome: string;
          descricao: string | null;
          tempo_impressao_horas: number;
          peso_usado: number;
          custo_material: number;
          custo_energia: number;
          custo_total: number;
          preco_minimo: number | null;
          preco_sugerido: number | null;
          margem: number | null;
          preco_venda: number;
          margem_percentual: number;
          status: "ativo" | "desativado";
          foto_url: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          project_id?: string | null;
          filamento_id?: string | null;
          nome: string;
          descricao?: string | null;
          tempo_impressao_horas: number;
          peso_usado: number;
          custo_material: number;
          custo_energia: number;
          custo_total: number;
          preco_minimo?: number | null;
          preco_sugerido?: number | null;
          margem?: number | null;
          preco_venda: number;
          margem_percentual: number;
          status?: "ativo" | "desativado";
          foto_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          project_id?: string | null;
          filamento_id?: string | null;
          nome?: string;
          descricao?: string | null;
          tempo_impressao_horas?: number;
          peso_usado?: number;
          custo_material?: number;
          custo_energia?: number;
          custo_total?: number;
          preco_minimo?: number | null;
          preco_sugerido?: number | null;
          margem?: number | null;
          preco_venda?: number;
          margem_percentual?: number;
          status?: "ativo" | "desativado";
          foto_url?: string | null;
        };
      };
      projects: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          name: string;
          description: string | null;
          status: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          name: string;
          description?: string | null;
          status?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          status?: string;
        };
      };
      project_filaments: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          project_id: string;
          filament_id: string;
          weight_grams: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          project_id: string;
          filament_id: string;
          weight_grams: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          project_id?: string;
          filament_id?: string;
          weight_grams?: number;
        };
      };
      project_costs: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          project_id: string;
          type: string;
          description: string | null;
          value: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          project_id: string;
          type: string;
          description?: string | null;
          value: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          project_id?: string;
          type?: string;
          description?: string | null;
          value?: number;
        };
      };
      accessories: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          nome: string;
          categoria: "ima" | "chaveiro" | "cola" | "tinta" | "outro";
          descricao: string | null;
          custo_unitario: number;
          estoque_atual: number;
          unidade: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          nome: string;
          categoria: "ima" | "chaveiro" | "cola" | "tinta" | "outro";
          descricao?: string | null;
          custo_unitario: number;
          estoque_atual?: number;
          unidade?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          nome?: string;
          categoria?: "ima" | "chaveiro" | "cola" | "tinta" | "outro";
          descricao?: string | null;
          custo_unitario?: number;
          estoque_atual?: number;
          unidade?: string;
        };
      };
      product_filaments: {
        Row: {
          id: string;
          created_at: string;
          produto_id: string;
          filamento_id: string;
          peso_usado: number;
          ordem: number;
          cor_identificacao: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          produto_id: string;
          filamento_id: string;
          peso_usado: number;
          ordem?: number;
          cor_identificacao?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          produto_id?: string;
          filamento_id?: string;
          peso_usado?: number;
          ordem?: number;
          cor_identificacao?: string | null;
        };
      };
      product_accessories: {
        Row: {
          id: string;
          created_at: string;
          produto_id: string;
          accessory_id: string;
          quantidade: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          produto_id: string;
          accessory_id: string;
          quantidade?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          produto_id?: string;
          accessory_id?: string;
          quantidade?: number;
        };
      };
      expense_categories: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          nome: string;
          descricao: string | null;
          cor: string;
          icone: string;
          ativo: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          nome: string;
          descricao?: string | null;
          cor?: string;
          icone?: string;
          ativo?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          nome?: string;
          descricao?: string | null;
          cor?: string;
          icone?: string;
          ativo?: boolean;
        };
      };
      capital_contributions: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          valor: number;
          origem: "pessoal" | "investimento" | "emprestimo" | "outro";
          data: string;
          observacao: string | null;
          comprovante_url: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          valor: number;
          origem: "pessoal" | "investimento" | "emprestimo" | "outro";
          data?: string;
          observacao?: string | null;
          comprovante_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          valor?: number;
          origem?: "pessoal" | "investimento" | "emprestimo" | "outro";
          data?: string;
          observacao?: string | null;
          comprovante_url?: string | null;
        };
      };
      sales: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          product_id: string;
          quantity: number;
          sale_price: number;
          total_sale: number;
          total_cost: number;
          profit: number;
          channel: string;
          payment_method: string | null;
          sale_date: string;
          customer: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          product_id: string;
          quantity: number;
          sale_price: number;
          total_sale: number;
          total_cost: number;
          profit: number;
          channel?: string;
          payment_method?: string | null;
          sale_date?: string;
          customer?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          product_id?: string;
          quantity?: number;
          sale_price?: number;
          total_sale?: number;
          total_cost?: number;
          profit?: number;
          channel?: string;
          payment_method?: string | null;
          sale_date?: string;
          customer?: string | null;
        };
      };
      sale_filaments: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          sale_id: string;
          filament_id: string;
          weight_grams: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          sale_id: string;
          filament_id: string;
          weight_grams: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          sale_id?: string;
          filament_id?: string;
          weight_grams?: number;
        };
      };
      cashflow: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          type: string;
          reference_id: string | null;
          value: number;
          date: string;
          description: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          type: string;
          reference_id?: string | null;
          value: number;
          date?: string;
          description?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          type?: string;
          reference_id?: string | null;
          value?: number;
          date?: string;
          description?: string | null;
        };
      };
      filament_consumption_logs: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          filamento_id: string;
          produto_id: string | null;
          sale_id: string | null;
          quantidade_consumida: number;
          peso_anterior: number;
          peso_posterior: number;
          operacao: "venda" | "teste" | "ajuste";
          observacao: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          filamento_id: string;
          produto_id?: string | null;
          sale_id?: string | null;
          quantidade_consumida: number;
          peso_anterior: number;
          peso_posterior: number;
          operacao: "venda" | "teste" | "ajuste";
          observacao?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          filamento_id?: string;
          produto_id?: string | null;
          sale_id?: string | null;
          quantidade_consumida?: number;
          peso_anterior?: number;
          peso_posterior?: number;
          operacao?: "venda" | "teste" | "ajuste";
          observacao?: string | null;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
          custo_kwh: number;
          consumo_impressora_watts: number;
          custo_hora_maquina: number;
          margem_lucro_padrao: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
          custo_kwh?: number;
          consumo_impressora_watts?: number;
          custo_hora_maquina?: number;
          margem_lucro_padrao?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
          custo_kwh?: number;
          consumo_impressora_watts?: number;
          custo_hora_maquina?: number;
          margem_lucro_padrao?: number;
        };
      };
    };
    Views: {};
    Functions: {
      calculate_print_cost: {
        Args: {
          peso_gramas: number;
          custo_por_kg: number;
          tempo_horas: number;
          custo_kwh: number;
          consumo_watts: number;
          custo_hora: number;
        };
        Returns: {
          custo_material: number;
          custo_energia: number;
          custo_maquina: number;
          custo_total: number;
        }[];
      };
      calculate_product_total_cost: {
        Args: {
          p_product_id: string;
          p_tempo_impressao_horas: number;
          p_custo_kwh: number;
          p_consumo_watts: number;
          p_custo_hora: number;
        };
        Returns: {
          custo_filamentos: number;
          custo_acessorios: number;
          custo_energia: number;
          custo_maquina: number;
          custo_total: number;
        }[];
      };
      calculate_balance: {
        Args: {
          p_user_id: string;
          p_data_inicio?: string;
          p_data_fim?: string;
        };
        Returns: {
          total_vendas: number;
          total_aportes: number;
          total_despesas: number;
          saldo_final: number;
          receita_liquida: number;
        }[];
      };
      category_expenses_summary: {
        Args: {
          p_user_id: string;
          p_data_inicio?: string;
          p_data_fim?: string;
        };
        Returns: {
          category_id: string;
          category_name: string;
          category_color: string;
          total_gasto: number;
          quantidade_despesas: number;
          percentual: number;
        }[];
      };
      filaments_by_brand_summary: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          brand_id: string;
          brand_name: string;
          total_filamentos: number;
          estoque_total: number;
          custo_total: number;
        }[];
      };
      low_stock_filaments: {
        Args: {
          p_user_id: string;
          p_threshold?: number;
        };
        Returns: {
          id: string;
          nome: string;
          marca: string;
          color_name: string;
          color_hex: string;
          peso_atual: number;
          custo_por_kg: number;
        }[];
      };
    };
  };
}
