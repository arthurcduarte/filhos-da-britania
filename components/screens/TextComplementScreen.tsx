"use client";

import Button from "@/components/ui/Button";

interface TextComplementScreenProps {
  complementText: string;
  characterName: string;
  onChange: (text: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function TextComplementScreen({
  complementText,
  characterName,
  onChange,
  onNext,
  onBack,
}: TextComplementScreenProps) {
  return (
    <div className="screen-enter min-h-[calc(100vh-88px)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <p className="font-display text-xs tracking-[0.3em] uppercase text-ink/40 mb-3">
          Antes de começar
        </p>
        <h2 className="font-display text-3xl text-ink mb-2">
          A História de {characterName || "seu Personagem"}
        </h2>
        <p className="font-body italic text-base text-ink/50 mt-1">
          O que mais define quem você é?
        </p>
        <div className="w-16 h-px bg-ink/20 mb-10" />

        {/* Prompts */}
        <div className="mb-6 space-y-2.5 pl-4 border-l-2 border-ink/12">
          {[
            "De onde você vem exatamente?",
            "Há alguém que você perdeu, ou alguém que te move?",
            "Existe uma cicatriz — literal ou não — que você carrega?",
            "O que você prometeu? Para quem?",
          ].map((prompt, i) => (
            <p key={i} className="font-body italic text-sm text-ink/40">
              {prompt}
            </p>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          value={complementText}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escreva livremente. Pode ser uma frase ou vários parágrafos."
          rows={7}
          className="parchment-input px-4 py-4 text-base"
        />
        <p className="mt-1.5 text-xs text-ink/25 text-right font-body">
          {complementText.length} caracteres
        </p>

        {/* Nav */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-ink/10">
          <Button variant="secondary" onClick={onBack}>← Voltar</Button>
          <Button variant="primary" onClick={onNext}>
            {complementText.trim() ? "Finalizar Personagem →" : "Pular e Finalizar →"}
          </Button>
        </div>

      </div>
    </div>
  );
}
