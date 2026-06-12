"use client";

import Button from "@/components/ui/Button";

interface IntroScreenProps {
  title: string;
  body: string;
  cta: string;
  onNext: () => void;
  onBack?: () => void;
  step: number;
}

export default function IntroScreen({ title, body, cta, onNext, onBack }: IntroScreenProps) {
  return (
    <div className="screen-enter min-h-[calc(100vh-88px)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">

        {/* Title */}
        <h1 className="font-display text-4xl md:text-5xl text-ink tracking-wide mb-2 leading-tight">
          {title}
        </h1>

        {/* Rule */}
        <div className="w-16 h-px bg-ink/30 mb-8 mt-5" />

        {/* Body */}
        <div className="space-y-5">
          {body.split("\n\n").map((para, i) => (
            <p key={i} className="font-body text-lg text-ink/75 leading-relaxed">
              {para}
            </p>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-12 flex items-center gap-6">
          <Button variant="primary" onClick={onNext}>
            {cta}
          </Button>
          {onBack && (
            <Button variant="ghost" onClick={onBack}>
              Voltar
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
