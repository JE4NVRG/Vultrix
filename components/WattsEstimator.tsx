"use client";

import { HelpCircle, Zap } from "lucide-react";
import { useState } from "react";

type WattsEstimate = {
  label: string;
  value: number;
  description: string;
};

const ESTIMATES: WattsEstimate[] = [
  {
    label: "FDM básica sem cama",
    value: 80,
    description: "Impressoras pequenas sem aquecimento de cama",
  },
  {
    label: "FDM com cama aquecida",
    value: 150,
    description: "Maioria das FDM domésticas (PLA/PETG)",
  },
  {
    label: "FDM high temp (ABS/ASA)",
    value: 220,
    description: "Impressoras com enclosure e cama 100°C+",
  },
  {
    label: "Resina",
    value: 60,
    description: "Impressoras LCD/DLP",
  },
];

type WattsEstimatorProps = {
  onSelect: (watts: number) => void;
};

export function WattsEstimator({ onSelect }: WattsEstimatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (estimate: WattsEstimate) => {
    onSelect(estimate.value);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-vultrix-accent hover:text-vultrix-accent/80 transition-colors flex items-center gap-2"
      >
        <HelpCircle size={16} />
        Não sei os watts
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 left-0 top-full mt-2 w-80 bg-vultrix-dark border border-vultrix-gray rounded-lg shadow-xl p-4">
            <div className="mb-3">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Zap size={16} className="text-vultrix-accent" />
                Escolha uma estimativa
              </h3>
              <p className="text-xs text-vultrix-light/60 mt-1">
                ⚠️ Recomendado medir depois com tomada medidora
              </p>
            </div>

            <div className="space-y-2">
              {ESTIMATES.map((estimate) => (
                <button
                  key={estimate.label}
                  type="button"
                  onClick={() => handleSelect(estimate)}
                  className="w-full text-left bg-vultrix-black hover:bg-vultrix-gray border border-vultrix-gray rounded-lg p-3 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">
                        {estimate.label}
                      </p>
                      <p className="text-xs text-vultrix-light/60 mt-1">
                        {estimate.description}
                      </p>
                    </div>
                    <div className="bg-vultrix-accent/20 text-vultrix-accent px-2 py-1 rounded text-sm font-bold">
                      {estimate.value}W
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
