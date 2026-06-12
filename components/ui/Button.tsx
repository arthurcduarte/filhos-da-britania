"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  variant = "primary",
  children,
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "font-display tracking-wider text-sm transition-all duration-200 focus:outline-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "px-8 py-3 bg-ink text-parchment hover:bg-ink-light border border-ink",
    secondary:
      "px-6 py-2.5 bg-transparent text-ink border border-ink/30 hover:border-ink hover:bg-ink/5",
    ghost:
      "px-4 py-2 text-ink/50 hover:text-ink underline underline-offset-4 decoration-ink/20 hover:decoration-ink/60",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
