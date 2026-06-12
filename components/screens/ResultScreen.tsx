"use client";

import { useState, useMemo } from "react";
import type { CharacterData } from "@/types/character";
import { buildImagePrompt, buildTextPrompt } from "@/lib/prompt-engine";

interface ResultScreenProps {
  character: CharacterData;
  onBack: () => void;
  onRestart: () => void;
}

const labelMaps = {
  gender:          { man: "Homem",                         woman: "Mulher" },
  socialPosition:  { servo: "Servo · Taeog",               "homem-livre": "Homem Livre · Bonheddwr", guerreiro: "Guerreiro Jurado · Combrogi", nobre: "Nobre · Uchelwr" },
  profession:      { lanca: "A Lança",                     palavra: "A Palavra", arte: "A Arte", veu: "O Véu", terra: "A Terra" },
  faith:           { "deuses-antigos": "Os Deuses Antigos", cristo: "O Cristo", "fe-dividida": "A Fé Dividida", mitraismo: "O Mitraísmo" },
  culturalTouch:   { romanizado: "Mais Romanizado",         tradicional: "Mais Tradicional" },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="font-display text-[10px] tracking-[0.2em] uppercase border px-3 py-1.5 transition-all duration-200
        border-ink/30 text-ink/50 hover:border-ink hover:text-ink"
    >
      {copied ? "✓ Copiado" : "Copiar prompt"}
    </button>
  );
}

function PromptPanel({
  label,
  sublabel,
  prompt,
  action,
}: {
  label: string;
  sublabel: string;
  prompt: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-ink/10">
        <div>
          <p className="font-display text-[10px] tracking-[0.25em] uppercase text-ink/40 mb-0.5">
            {label}
          </p>
          <p className="font-body italic text-xs text-ink/50">{sublabel}</p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {action}
          <CopyButton text={prompt} />
        </div>
      </div>

      {/* Prompt text */}
      <div className="flex-1 overflow-y-auto">
        <pre className="font-body text-[11px] leading-relaxed text-ink/70 whitespace-pre-wrap break-words">
          {prompt}
        </pre>
      </div>
    </div>
  );
}

export default function ResultScreen({ character, onBack, onRestart }: ResultScreenProps) {
  // variant controla SÓ a pose — a identidade do personagem (rosto, cores,
  // marcas, equipamento) é estável, derivada das escolhas do jogador.
  const [poseVariant, setPoseVariant] = useState(0);

  const imagePrompt = useMemo(
    () => buildImagePrompt(character, poseVariant),
    [character, poseVariant]
  );
  const textPrompt = useMemo(() => buildTextPrompt(character), [character]);

  const attrs = [
    { label: "Gênero",           value: labelMaps.gender[character.gender!] },
    { label: "Posição Social",   value: labelMaps.socialPosition[character.socialPosition!] },
    { label: "Ofício",           value: labelMaps.profession[character.profession!] },
    { label: "Fé",               value: labelMaps.faith[character.faith!] },
    { label: "Herança Cultural", value: labelMaps.culturalTouch[character.culturalTouch!] },
  ];

  return (
    <div className="screen-enter min-h-screen bg-parchment flex flex-col">

      {/* ── Top chrome ── */}
      <div className="no-print px-8 py-4 flex items-center justify-between border-b border-ink/10">
        <span className="font-body italic text-sm text-ink/40">Criação de Personagens</span>
        <span className="font-body text-sm text-ink/30">Tela 09</span>
      </div>

      {/* ── Character identity header ── */}
      <div className="px-8 lg:px-14 pt-10 pb-6">
        <h1
          className="text-5xl md:text-6xl lg:text-7xl text-ink leading-[1.1] break-words mb-6"
          style={{ fontFamily: "var(--font-medieval)" }}
        >
          {character.name || "Sem Nome"}
        </h1>

        <div className="w-full h-px bg-ink/15 mb-5" />

        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-2">
          {attrs.map((a) => (
            <div key={a.label}>
              <span className="font-display text-[10px] tracking-[0.2em] uppercase text-ink/35">
                {a.label}
              </span>
              <span className="font-body text-sm text-ink/70 ml-2">{a.value}</span>
            </div>
          ))}
        </div>

        {character.complementText && (
          <p className="font-body italic text-sm text-ink/45 mt-3">
            "{character.complementText}"
          </p>
        )}

        <div className="w-full h-px bg-ink/10 mt-5" />
      </div>

      {/* ── Two prompt columns ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-ink/10 px-0">

        {/* LEFT — Image Prompt */}
        <div className="p-8 lg:p-14 lg:pt-8 flex flex-col" style={{ minHeight: "420px" }}>
          <PromptPanel
            label="Prompt para Imagem"
            sublabel="Cole no ChatGPT — ele interpreta e gera via GPT Image"
            prompt={imagePrompt}
            action={
              <button
                onClick={() => setPoseVariant((v) => v + 1)}
                title="Mesma pessoa, outra pose"
                className="font-display text-[10px] tracking-[0.2em] uppercase border px-3 py-1.5 transition-all duration-200
                  border-ink/30 text-ink/50 hover:border-ink hover:text-ink"
              >
                ↻ Variar pose
              </button>
            }
          />
        </div>

        {/* RIGHT — Text Prompt */}
        <div className="p-8 lg:p-14 lg:pt-8 flex flex-col" style={{ minHeight: "420px" }}>
          <PromptPanel
            label="Prompt para Texto"
            sublabel="Cole em ChatGPT, Claude, Gemini ou similar"
            prompt={textPrompt}
          />
        </div>

      </div>

      {/* ── Footer actions ── */}
      <div className="no-print px-8 lg:px-14 py-5 border-t border-ink/10 flex flex-wrap items-center gap-3">
        <button
          onClick={() => window.print()}
          className="font-display text-xs tracking-[0.2em] uppercase text-ink border border-ink px-5 py-2.5 hover:bg-ink hover:text-parchment transition-all duration-200"
        >
          Imprimir / PDF
        </button>
        <button
          onClick={onBack}
          className="font-display text-xs tracking-[0.2em] uppercase text-ink/40 hover:text-ink transition-colors"
        >
          ← Editar
        </button>
        <button
          onClick={onRestart}
          className="font-display text-xs tracking-[0.2em] uppercase text-ink/40 hover:text-ink transition-colors ml-auto"
        >
          Novo personagem
        </button>
      </div>

      {/* ── Bottom chrome ── */}
      <div className="no-print px-8 lg:px-14 py-3 border-t border-ink/10 flex items-center justify-between">
        <span className="font-display text-xs font-semibold tracking-[0.2em] uppercase text-ink/50">
          Filhos da Britânia
        </span>
        <span className="font-body text-sm text-ink/30">2026</span>
      </div>

    </div>
  );
}
