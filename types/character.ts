export type Gender = "man" | "woman";
export type AgeRange = "11-15" | "16-25" | "26-36" | "37-50" | "51-65";
export type SocialPosition = "servo" | "homem-livre" | "guerreiro" | "nobre";
export type Profession = "lanca" | "palavra" | "arte" | "veu" | "terra";
export type Faith = "deuses-antigos" | "cristo" | "fe-dividida" | "mitraismo";
export type CulturalTouch = "romanizado" | "tradicional";

export interface CharacterData {
  name: string;
  gender: Gender | null;
  ageRange: AgeRange | null;
  socialPosition: SocialPosition | null;
  profession: Profession | null;
  faith: Faith | null;
  culturalTouch: CulturalTouch | null;
  socialPositionText: string;
  professionText: string;
  faithText: string;
  culturalTouchText: string;
  complementText: string;
}

export interface AttributeOption {
  id: string;
  label: string;
  subtitle?: string;
  description: string;
}

export interface AttributeConfig {
  title: string;
  subtitle?: string;
  options: AttributeOption[];
}
