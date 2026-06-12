"use client";

import Button from "@/components/ui/Button";
import type { AttributeConfig } from "@/types/character";

interface AttributeScreenProps {
  config: AttributeConfig;
  selectedId: string | null;
  additionalText: string;
  onSelect: (id: string) => void;
  onTextChange: (text: string) => void;
  onNext: () => void;
  onBack: () => void;
  textPlaceholder?: string;
}

export default function AttributeScreen({
  config,
  selectedId,
  additionalText,
  onSelect,
  onTextChange,
  onNext,
  onBack,
  textPlaceholder,
}: AttributeScreenProps) {
  const selectedOption = config.options.find((o) => o.id === selectedId);

  return (
    <div className="screen-enter min-h-[calc(100vh-88px)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-4xl">

        {/* Header */}
        <p className="font-display text-xs tracking-[0.3em] uppercase text-ink/40 mb-3">
          Defina seu personagem
        </p>
        <h2 className="font-display text-3xl text-ink mb-2">{config.title}</h2>
        {config.subtitle && (
          <p className="font-body italic text-base text-ink/50 mb-1">{config.subtitle}</p>
        )}
        <div className="w-16 h-px bg-ink/20 mb-10" />

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">

          {/* Options list */}
          <div className="lg:col-span-2 space-y-1.5">
            {config.options.map((option) => (
              <button
                key={option.id}
                onClick={() => onSelect(option.id)}
                className={`w-full text-left px-4 py-3.5 border font-display text-sm tracking-wide transition-all duration-200 ${
                  selectedId === option.id
                    ? "bg-ink text-parchment border-ink"
                    : "bg-transparent text-ink border-ink/20 hover:border-ink/60"
                }`}
              >
                {option.label}
                {option.subtitle && (
                  <span
                    className={`ml-2 font-body text-xs not-italic ${
                      selectedId === option.id ? "text-parchment/50" : "text-ink/35"
                    }`}
                  >
                    {option.subtitle}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Description + input */}
          <div className="lg:col-span-3 flex flex-col gap-6">

            {/* Description */}
            <div className="min-h-[160px] pl-5 border-l-2 border-ink/15">
              {selectedOption ? (
                <div className="screen-enter">
                  <h3 className="font-display text-base text-ink mb-3">
                    {selectedOption.label}
                    {selectedOption.subtitle && (
                      <span className="font-body italic text-sm text-ink/40 ml-2">
                        — {selectedOption.subtitle}
                      </span>
                    )}
                  </h3>
                  <p className="font-body text-base text-ink/65 leading-relaxed">
                    {selectedOption.description}
                  </p>
                </div>
              ) : (
                <p className="font-body italic text-base text-ink/25 leading-relaxed mt-2">
                  Selecione uma opção para ver sua descrição.
                </p>
              )}
            </div>

            {/* Extra text */}
            <div>
              <p className="font-display text-[11px] tracking-[0.2em] uppercase text-ink/35 mb-2">
                Detalhes adicionais (opcional)
              </p>
              <textarea
                value={additionalText}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder={textPlaceholder ?? "Algum detalhe adicional sobre este aspecto do personagem..."}
                rows={3}
                className="parchment-input px-4 py-3"
              />
            </div>

          </div>
        </div>

        {/* Nav */}
        <div className="flex items-center justify-between mt-10 pt-5 border-t border-ink/10">
          <Button variant="secondary" onClick={onBack}>← Voltar</Button>
          <Button variant="primary" onClick={onNext} disabled={!selectedId}>
            Continuar →
          </Button>
        </div>

      </div>
    </div>
  );
}
