"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  User,
  Instagram,
  Phone,
  MapPin,
  DollarSign,
  Percent,
  Package,
  Tag,
  Send,
  Save,
  RotateCcw,
  Upload,
  CheckCircle,
  ArrowLeft,
  Edit3,
  X,
  Image,
} from "lucide-react";

type ProfileData = {
  display_name?: string;
  handle?: string;
  whatsapp?: string;
  city?: string;
  logo_url?: string;
  currency?: string;
  timezone?: string;
  default_profit_margin_percent?: number;
  default_include_packaging?: boolean;
  default_include_label?: boolean;
  default_include_shipping?: boolean;
  default_kwh_cost?: number;
};

export default function PerfilPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ProfileData>({
    display_name: "",
    handle: "",
    whatsapp: "",
    city: "",
    logo_url: "",
    currency: "BRL",
    timezone: "America/Sao_Paulo",
    default_profit_margin_percent: 50,
    default_include_packaging: true,
    default_include_label: true,
    default_include_shipping: false,
    default_kwh_cost: 0.95,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_profile")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);

      const { error } = await supabase.from("user_profile").upsert(
        {
          user_id: user!.id,
          ...profile,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      if (error) {
        console.error("Detalhes do erro:", error);
        throw error;
      }

      setSaved(true);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Erro ao salvar perfil:", error);
      const errorMsg = error?.message || "Erro desconhecido";
      alert(
        `Erro ao salvar perfil: ${errorMsg}\n\nVerifique se a migration 014 foi executada no Supabase.`,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = () => {
    setProfile({
      ...profile,
      default_profit_margin_percent: 50,
      default_include_packaging: true,
      default_include_label: true,
      default_include_shipping: false,
      default_kwh_cost: 0.95,
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione uma imagem válida");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Imagem muito grande. Máximo 2MB");
      return;
    }

    try {
      setUploading(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${user!.id}/logo-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-images").getPublicUrl(fileName);

      setProfile({ ...profile, logo_url: publicUrl });
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      alert(`Erro ao fazer upload da imagem: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleContinueEditing = () => {
    setShowSuccessModal(false);
    setSaved(false);
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-xl">Carregando perfil...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <User className="text-vultrix-accent" />
            Perfil
          </h1>
          <p className="text-vultrix-light/60 mt-1">
            Configure sua identidade e preferências padrão
          </p>
        </div>
      </div>

      {/* Bloco 1: Identidade */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-vultrix-dark border border-vultrix-gray rounded-lg p-6"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <User size={20} className="text-vultrix-accent" />
          Identidade
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome/Empresa */}
          <div>
            <label className="block text-sm font-medium text-vultrix-light mb-2">
              Nome / Empresa
            </label>
            <input
              type="text"
              value={profile.display_name || ""}
              onChange={(e) =>
                setProfile({ ...profile, display_name: e.target.value })
              }
              placeholder="Ex: João Silva Impressões"
              className="w-full bg-vultrix-black border border-vultrix-gray rounded-lg px-4 py-2 text-white focus:outline-none focus:border-vultrix-accent"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-sm font-medium text-vultrix-light mb-2 flex items-center gap-2">
              <Phone size={16} />
              WhatsApp
            </label>
            <input
              type="text"
              value={profile.whatsapp || ""}
              onChange={(e) =>
                setProfile({ ...profile, whatsapp: e.target.value })
              }
              placeholder="(11) 99999-9999"
              className="w-full bg-vultrix-black border border-vultrix-gray rounded-lg px-4 py-2 text-white focus:outline-none focus:border-vultrix-accent"
            />
          </div>

          {/* Instagram */}
          <div>
            <label className="block text-sm font-medium text-vultrix-light mb-2 flex items-center gap-2">
              <Instagram size={16} />
              Instagram
            </label>
            <div className="flex items-center">
              <span className="bg-vultrix-black border border-vultrix-gray border-r-0 rounded-l-lg px-3 py-2 text-vultrix-light/60">
                @
              </span>
              <input
                type="text"
                value={profile.handle || ""}
                onChange={(e) =>
                  setProfile({ ...profile, handle: e.target.value })
                }
                placeholder="usuario"
                className="flex-1 bg-vultrix-black border border-vultrix-gray rounded-r-lg px-4 py-2 text-white focus:outline-none focus:border-vultrix-accent"
              />
            </div>
          </div>

          {/* Cidade */}
          <div>
            <label className="block text-sm font-medium text-vultrix-light mb-2 flex items-center gap-2">
              <MapPin size={16} />
              Cidade
            </label>
            <input
              type="text"
              value={profile.city || ""}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              placeholder="Ex: São Paulo, SP"
              className="w-full bg-vultrix-black border border-vultrix-gray rounded-lg px-4 py-2 text-white focus:outline-none focus:border-vultrix-accent"
            />
          </div>

          {/* Logo Upload */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-vultrix-light mb-2 flex items-center gap-2">
              <Image size={16} />
              Logo / Foto do Perfil
            </label>

            <div className="flex items-center gap-4">
              {profile.logo_url && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-vultrix-gray">
                  <img
                    src={profile.logo_url}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, logo_url: "" })}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full bg-vultrix-gray hover:bg-vultrix-gray/80 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Upload size={18} />
                  {uploading ? "Enviando..." : "Fazer Upload de Imagem"}
                </button>
                <p className="text-xs text-vultrix-light/60 mt-1">
                  PNG, JPG ou WEBP. Máximo 2MB
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bloco 2: Defaults Operacionais */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-vultrix-dark border border-vultrix-gray rounded-lg p-6"
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <DollarSign size={20} className="text-vultrix-accent" />
          Defaults Operacionais
        </h2>

        <div className="space-y-6">
          {/* Custo kWh */}
          <div>
            <label className="block text-sm font-medium text-vultrix-light mb-2 flex items-center gap-2">
              <DollarSign size={16} />
              Custo do kWh (R$/kWh)
              <span
                className="text-xs text-vultrix-light/60 ml-auto cursor-help"
                title="Você encontra esse valor na sua conta de energia elétrica"
              >
                💡 Veja na conta de energia
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={profile.default_kwh_cost || 0}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  default_kwh_cost: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-vultrix-black border border-vultrix-gray rounded-lg px-4 py-2 text-white focus:outline-none focus:border-vultrix-accent"
            />
          </div>

          {/* Margem Padrão */}
          <div>
            <label className="block text-sm font-medium text-vultrix-light mb-2 flex items-center gap-2">
              <Percent size={16} />
              Margem Padrão (%)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              value={profile.default_profit_margin_percent || 0}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  default_profit_margin_percent:
                    parseFloat(e.target.value) || 0,
                })
              }
              className="w-full bg-vultrix-black border border-vultrix-gray rounded-lg px-4 py-2 text-white focus:outline-none focus:border-vultrix-accent"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-vultrix-light">
              Incluir por padrão nas vendas:
            </p>

            {/* Embalagem */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={profile.default_include_packaging || false}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    default_include_packaging: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-vultrix-gray bg-vultrix-black checked:bg-vultrix-accent focus:ring-2 focus:ring-vultrix-accent"
              />
              <Package
                size={18}
                className="text-vultrix-light/60 group-hover:text-white"
              />
              <span className="text-vultrix-light group-hover:text-white">
                Incluir embalagem
              </span>
            </label>

            {/* Etiqueta */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={profile.default_include_label || false}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    default_include_label: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-vultrix-gray bg-vultrix-black checked:bg-vultrix-accent focus:ring-2 focus:ring-vultrix-accent"
              />
              <Tag
                size={18}
                className="text-vultrix-light/60 group-hover:text-white"
              />
              <span className="text-vultrix-light group-hover:text-white">
                Incluir etiqueta
              </span>
            </label>

            {/* Envio */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={profile.default_include_shipping || false}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    default_include_shipping: e.target.checked,
                  })
                }
                className="w-5 h-5 rounded border-vultrix-gray bg-vultrix-black checked:bg-vultrix-accent focus:ring-2 focus:ring-vultrix-accent"
              />
              <Send
                size={18}
                className="text-vultrix-light/60 group-hover:text-white"
              />
              <span className="text-vultrix-light group-hover:text-white">
                Incluir envio
              </span>
            </label>
          </div>
        </div>
      </motion.div>

      {/* Ações */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-4"
      >
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-vultrix-accent hover:bg-vultrix-accent/80 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={20} />
          {saving ? "Salvando..." : saved ? "✓ Salvo!" : "Salvar"}
        </button>

        <button
          onClick={handleRestore}
          className="bg-vultrix-gray hover:bg-vultrix-gray/80 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw size={20} />
          Restaurar Padrões
        </button>
      </motion.div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
              onClick={handleContinueEditing}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-vultrix-dark border-2 border-vultrix-accent rounded-lg p-8 max-w-md w-full"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="text-green-500" size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Perfil Atualizado com Sucesso!
                  </h2>
                  <p className="text-vultrix-light/70 mb-6">
                    Suas informações foram salvas e estão prontas para uso.
                  </p>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleGoToDashboard}
                      className="w-full bg-vultrix-accent hover:bg-vultrix-accent/80 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowLeft size={20} />
                      Voltar ao Dashboard
                    </button>
                    <button
                      onClick={handleContinueEditing}
                      className="w-full bg-vultrix-gray hover:bg-vultrix-gray/80 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit3 size={20} />
                      Continuar Editando
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
