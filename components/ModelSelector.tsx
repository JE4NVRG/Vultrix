"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Zap } from "lucide-react";
import { PrinterModel } from "@/lib/hooks/usePrinterModels";

type ModelSelectorProps = {
  models: PrinterModel[];
  onSelect: (model: PrinterModel) => void;
  disabled?: boolean;
};

export function ModelSelector({
  models,
  onSelect,
  disabled,
}: ModelSelectorProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredModels =
    search.length >= 2
      ? models.filter(
          (m) =>
            m.brand.toLowerCase().includes(search.toLowerCase()) ||
            m.model.toLowerCase().includes(search.toLowerCase()),
        )
      : models;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (model: PrinterModel) => {
    onSelect(model);
    setSearch("");
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium text-vultrix-light mb-2 flex items-center gap-2">
        <Search size={16} />
        Buscar Modelo (opcional)
      </label>

      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Digite marca ou modelo..."
          disabled={disabled}
          className="w-full bg-vultrix-black border border-vultrix-gray rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:border-vultrix-accent disabled:opacity-50"
        />
        <ChevronDown
          size={20}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-vultrix-light/60 pointer-events-none"
        />
      </div>

      {isOpen && filteredModels.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-vultrix-dark border border-vultrix-gray rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {filteredModels.map((model) => (
            <button
              key={model.id}
              onClick={() => handleSelect(model)}
              className="w-full text-left px-4 py-3 hover:bg-vultrix-gray transition-colors border-b border-vultrix-gray/50 last:border-0"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-white font-medium">
                    {model.brand} — {model.model}
                  </p>
                  {model.notes && (
                    <p className="text-xs text-vultrix-light/60 mt-1">
                      {model.notes}
                    </p>
                  )}
                </div>
                {model.avg_watts && (
                  <div className="flex items-center gap-1 text-xs text-vultrix-accent bg-vultrix-accent/10 px-2 py-1 rounded">
                    <Zap size={12} />
                    {model.avg_watts}W
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && search.length >= 2 && filteredModels.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-vultrix-dark border border-vultrix-gray rounded-lg shadow-xl p-4">
          <p className="text-vultrix-light/60 text-sm text-center">
            Nenhum modelo encontrado. Você pode cadastrar manualmente.
          </p>
        </div>
      )}

      <p className="text-xs text-vultrix-light/60 mt-1">
        Selecione um modelo para preencher automaticamente os dados
      </p>
    </div>
  );
}
