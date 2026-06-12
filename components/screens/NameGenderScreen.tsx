"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { genderDescriptions, ageRangeOptions } from "@/data/character-data";
import type { Gender, AgeRange } from "@/types/character";

interface NameGenderScreenProps {
  name: string;
  gender: Gender | null;
  ageRange: AgeRange | null;
  onNameChange: (name: string) => void;
  onGenderChange: (gender: Gender) => void;
  onAgeRangeChange: (age: AgeRange) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function NameGenderScreen({
  name,
  gender,
  ageRange,
  onNameChange,
  onGenderChange,
  onAgeRangeChange,
  onNext,
  onBack,
}: NameGenderScreenProps) {
  const [loadingName, setLoadingName] = useState(false);

  const generateName = async () => {
    setLoadingName(true);
    try {
      const res = await fetch("/api/generate-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gender: gender ?? "man" }),
      });
      const data = await res.json();
      onNameChange(data.name);
    } finally {
      setLoadingName(false);
    }
  };

  const canContinue = name.trim().length > 0 && gender !== null && ageRange !== null;

  return (
    <div className="screen-enter min-h-[calc(100vh-88px)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <p className="font-display text-xs tracking-[0.3em] uppercase text-ink/40 mb-3">
          Quem é você
        </p>
        <h2 className="font-display text-3xl text-ink mb-2">Nome, Gênero e Idade</h2>
        <div className="w-16 h-px bg-ink/20 mb-10" />

        {/* Gender */}
        <div className="mb-8">
          <p className="font-body italic text-base text-ink/50 mb-4">Você é —</p>
          <div className="grid grid-cols-2 gap-3">
            {(["man", "woman"] as Gender[]).map((g) => (
              <button
                key={g}
                onClick={() => onGenderChange(g)}
                className={`py-3.5 px-5 border font-display text-sm tracking-wide transition-all duration-200 text-left ${
                  gender === g
                    ? "bg-ink text-parchment border-ink"
                    : "bg-transparent text-ink border-ink/25 hover:border-ink/70"
                }`}
              >
                {g === "man" ? "Homem" : "Mulher"}
              </button>
            ))}
          </div>

          {gender && (
            <div className="mt-4 pl-4 border-l-2 border-ink/15">
              <p className="font-body text-base text-ink/60 leading-relaxed italic">
                {genderDescriptions[gender]}
              </p>
            </div>
          )}
        </div>

        {/* Age Range */}
        <div className="mb-8">
          <p className="font-body italic text-base text-ink/50 mb-4">Sua idade —</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ageRangeOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onAgeRangeChange(opt.id)}
                className={`py-3 px-4 border font-display text-sm tracking-wide transition-all duration-200 text-left ${
                  ageRange === opt.id
                    ? "bg-ink text-parchment border-ink"
                    : "bg-transparent text-ink border-ink/25 hover:border-ink/70"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {ageRange && (
            <div className="mt-4 pl-4 border-l-2 border-ink/15">
              <p className="font-body text-base text-ink/60 leading-relaxed italic">
                {ageRangeOptions.find((o) => o.id === ageRange)?.description}
              </p>
            </div>
          )}
        </div>

        {/* Name */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <p className="font-body italic text-base text-ink/50">Seu nome —</p>
            <button
              onClick={generateName}
              disabled={loadingName}
              className="text-xs text-ink/40 hover:text-ink font-display tracking-wide transition-colors disabled:opacity-30"
            >
              {loadingName ? "Gerando..." : "↺ Sugerir nome bretão"}
            </button>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Nome do personagem..."
            className="parchment-input px-4 py-3 text-xl font-display tracking-wide"
            maxLength={60}
          />
          <p className="mt-2 text-xs text-ink/30 font-body italic">
            Nomes da Britânia do século V tendem a soar bretões, galeses ou com influência latina.
          </p>
        </div>

        {/* Nav */}
        <div className="flex items-center justify-between pt-5 border-t border-ink/10">
          <Button variant="secondary" onClick={onBack}>← Voltar</Button>
          <Button variant="primary" onClick={onNext} disabled={!canContinue}>
            Continuar →
          </Button>
        </div>

      </div>
    </div>
  );
}
