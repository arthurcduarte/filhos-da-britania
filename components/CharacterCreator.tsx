"use client";

import { useState, useCallback } from "react";
import ProgressBar from "@/components/ui/ProgressBar";
import IntroScreen from "@/components/screens/IntroScreen";
import NameGenderScreen from "@/components/screens/NameGenderScreen";
import AttributeScreen from "@/components/screens/AttributeScreen";
import TextComplementScreen from "@/components/screens/TextComplementScreen";
import ResultScreen from "@/components/screens/ResultScreen";
import {
  socialPositionConfig,
  professionConfig,
  faithConfig,
  culturalTouchConfig,
  introText1,
  introText2,
} from "@/data/character-data";
import type {
  CharacterData,
  Gender,
  AgeRange,
  SocialPosition,
  Profession,
  Faith,
  CulturalTouch,
} from "@/types/character";

const TOTAL_STEPS = 9;

const emptyCharacter: CharacterData = {
  name: "",
  gender: null,
  ageRange: null,
  socialPosition: null,
  profession: null,
  faith: null,
  culturalTouch: null,
  socialPositionText: "",
  professionText: "",
  faithText: "",
  culturalTouchText: "",
  complementText: "",
};

export default function CharacterCreator() {
  const [step, setStep] = useState(1);
  const [character, setCharacter] = useState<CharacterData>(emptyCharacter);
  const [screenKey, setScreenKey] = useState(0);

  const goTo = useCallback((nextStep: number) => {
    setScreenKey((k) => k + 1);
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const next = () => goTo(step + 1);
  const back = () => goTo(step - 1);

  const update = <K extends keyof CharacterData>(key: K, value: CharacterData[K]) => {
    setCharacter((prev) => ({ ...prev, [key]: value }));
  };

  const restart = () => {
    setCharacter(emptyCharacter);
    goTo(1);
  };

  const isResult = step === TOTAL_STEPS;
  const showProgress = step > 2 && step < TOTAL_STEPS;

  return (
    <div className="min-h-screen bg-parchment flex flex-col">

      {/* ── HEADER CHROME ── */}
      <header className="no-print sticky top-0 z-40 bg-parchment border-b border-ink/10">
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-3 flex items-center justify-between">
          <span className="font-body italic text-sm text-ink/50">
            Criação de Personagens
          </span>

          {showProgress && (
            <div className="flex-1 mx-8 hidden sm:block">
              <ProgressBar currentStep={step} totalSteps={TOTAL_STEPS} />
            </div>
          )}

          <span className="font-body text-sm text-ink/40 tabular-nums">
            Tela {String(step).padStart(2, "0")}
          </span>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main className="flex-1 flex flex-col items-center justify-center overflow-x-hidden">
        <div key={screenKey} className="w-full">

          {step === 1 && (
            <IntroScreen
              title={introText1.title}
              body={introText1.body}
              cta={introText1.cta}
              onNext={next}
              step={step}
            />
          )}

          {step === 2 && (
            <IntroScreen
              title={introText2.title}
              body={introText2.body}
              cta={introText2.cta}
              onNext={next}
              onBack={back}
              step={step}
            />
          )}

          {step === 3 && (
            <NameGenderScreen
              name={character.name}
              gender={character.gender}
              ageRange={character.ageRange}
              onNameChange={(v) => update("name", v)}
              onGenderChange={(v) => update("gender", v as Gender)}
              onAgeRangeChange={(v) => update("ageRange", v as AgeRange)}
              onNext={next}
              onBack={back}
            />
          )}

          {step === 4 && (
            <AttributeScreen
              config={socialPositionConfig}
              selectedId={character.socialPosition}
              additionalText={character.socialPositionText}
              onSelect={(id) => update("socialPosition", id as SocialPosition)}
              onTextChange={(v) => update("socialPositionText", v)}
              onNext={next}
              onBack={back}
              textPlaceholder="Há algo específico sobre sua origem social que define quem você é hoje?"
            />
          )}

          {step === 5 && (
            <AttributeScreen
              config={professionConfig}
              selectedId={character.profession}
              additionalText={character.professionText}
              onSelect={(id) => update("profession", id as Profession)}
              onTextChange={(v) => update("professionText", v)}
              onNext={next}
              onBack={back}
              textPlaceholder="Como você chegou a dominar este ofício? Quem te ensinou?"
            />
          )}

          {step === 6 && (
            <AttributeScreen
              config={faithConfig}
              selectedId={character.faith}
              additionalText={character.faithText}
              onSelect={(id) => update("faith", id as Faith)}
              onTextChange={(v) => update("faithText", v)}
              onNext={next}
              onBack={back}
              textPlaceholder="Como sua fé se manifesta no cotidiano? Há algum ritual ou objeto que a define?"
            />
          )}

          {step === 7 && (
            <AttributeScreen
              config={culturalTouchConfig}
              selectedId={character.culturalTouch}
              additionalText={character.culturalTouchText}
              onSelect={(id) => update("culturalTouch", id as CulturalTouch)}
              onTextChange={(v) => update("culturalTouchText", v)}
              onNext={next}
              onBack={back}
              textPlaceholder="Como essa herança se reflete no seu modo de falar, vestir e decidir?"
            />
          )}

          {step === 8 && (
            <TextComplementScreen
              complementText={character.complementText}
              characterName={character.name}
              onChange={(v) => update("complementText", v)}
              onNext={next}
              onBack={back}
            />
          )}

          {step === 9 && (
            <ResultScreen
              character={character}
              onBack={back}
              onRestart={restart}
            />
          )}

        </div>
      </main>

      {/* ── FOOTER CHROME ── */}
      <footer className={`no-print border-t border-ink/10 bg-parchment ${isResult ? "hidden" : ""}`}>
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-3 flex items-center justify-between">
          <span className="font-display text-xs font-semibold tracking-[0.2em] uppercase text-ink/60">
            Filhos da Britânia
          </span>
          <span className="font-body text-sm text-ink/30">2026</span>
        </div>
      </footer>

    </div>
  );
}
