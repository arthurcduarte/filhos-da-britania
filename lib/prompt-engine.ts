import type { CharacterData } from "@/types/character";
import {
  socialPositionConfig,
  professionConfig,
  faithConfig,
  culturalTouchConfig,
  ageRangeOptions,
  genderDescriptions,
} from "@/data/character-data";

// ═══════════════════════════════════════════════════════════════════════════
// PROMPT ENGINE — motor único de prompts (imagem + texto)
//
// Arquitetura:
//   1. IDENTIDADE DOMINANTE — regras hierárquicas decidem se as escolhas
//      formam um arquétipo que comanda a aparência inteira (monge, druida,
//      senhor da guerra...). Cada regra cobre uma FAMÍLIA de combinações.
//   2. QUALIDADE DE MATERIAL — a posição social define tecido, fecho,
//      calçado e CORES em qualquer identidade.
//   3. ACENTOS — cultura e fé entram dosados (1 item), nunca competindo.
//   4. NOTAS DO JOGADOR — canônicas, no TOPO do prompt, com instrução de
//      tradução biográfico→visual dirigida ao ChatGPT.
//   5. IDENTIDADE PERSISTENTE — os traços do personagem (rosto, cores,
//      marcas, equipamento) são derivados de um seed estável: o mesmo
//      personagem gera sempre a mesma pessoa. Só a POSE varia com o
//      parâmetro `variant` (botão "Variar pose").
//
// Formato de saída: instrução para o ChatGPT (fluxo oficial: colar no
// ChatGPT, que interpreta e gera via GPT Image).
// ═══════════════════════════════════════════════════════════════════════════

// ── RNG com seed (identidade persistente) ───────────────────────────────────

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// rand é trocado por buildImagePrompt: seed do personagem para os traços,
// seed do personagem+variant para a pose.
let rand: () => number = Math.random;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function maybe(chance: number, value: string): string {
  return rand() < chance ? value : "";
}

function pickSome<T>(arr: T[], min: number, max: number): T[] {
  const count = min + Math.floor(rand() * (max - min + 1));
  return [...arr].sort(() => rand() - 0.5).slice(0, Math.min(count, arr.length));
}

function joinParts(parts: (string | undefined | null)[], sep = ". "): string {
  return parts.map(p => p?.trim()).filter(Boolean).join(sep);
}

// ── Contexto ────────────────────────────────────────────────────────────────

type Ctx = {
  isFemale: boolean;
  gender: "male" | "female";
  sp: string;
  prof: string;
  faith: string;
  culture: string;
  ageRange: string;
  quality: MaterialQuality;
  colors: GarmentColors;
  hasShield: boolean;     // trait estável p/ ofício Lança
  hasCheckedCloak: boolean; // trait estável p/ cultura Tradicional
};

// ── Cores de vestuário por posição social (tinturas do período) ────────────

type GarmentColors = { tunic: string; cloak: string };

const DYE_TIERS: Record<string, string[]> = {
  servo:         ["undyed natural brown", "undyed off-white", "dull grey-brown"],
  "homem-livre": ["weld-yellow", "terracotta", "walnut brown", "undyed off-white"],
  guerreiro:     ["madder red", "woad blue", "moss green", "walnut brown"],
  nobre:         ["deep woad blue", "rich madder red", "moss green", "warm ochre"],
};

function pickColors(sp: string): GarmentColors {
  const tier = DYE_TIERS[sp] ?? DYE_TIERS["homem-livre"];
  const tunic = pick(tier);
  const cloakOptions = tier.filter(c => c !== tunic);
  const cloak = pick(cloakOptions.length ? cloakOptions : tier);
  return { tunic, cloak };
}

// ── Qualidade de material por posição social ────────────────────────────────

type MaterialQuality = {
  tier: "servo" | "homem-livre" | "guerreiro" | "nobre" | "neutro";
  fabric: string;
  fastening: string;
  footwear: string;
  condition: string;
};

function materialQuality(sp: string): MaterialQuality {
  switch (sp) {
    case "servo": return {
      tier: "servo",
      fabric: "thick coarse wool",
      fastening: "no fibula — garments fastened by knot or simple bone pin",
      footwear: "bare feet or crude strap sandals",
      condition: "clothes visibly patched, mended and worn thin at the elbows",
    };
    case "homem-livre": return {
      tier: "homem-livre",
      fabric: "medium-quality wool",
      fastening: "common bronze penannular fibula and a leather belt with simple iron buckle",
      footwear: "simple stitched leather shoes",
      condition: "clothes plain but well kept",
    };
    case "guerreiro": return {
      tier: "guerreiro",
      fabric: "well-dyed quality wool",
      fastening: "silver penannular fibula — a mark of sworn status",
      footwear: "sturdy leather boots",
      condition: "garments functional and maintained, leather showing marks of honest use",
    };
    case "nobre": return {
      tier: "nobre",
      fabric: "fine wool over a linen undershirt",
      fastening: "silver or gold fibula on the cloak",
      footwear: "well-worked leather boots",
      condition: "garments of visible quality, clean and well maintained",
    };
    default: return {
      tier: "neutro",
      fabric: "plain wool",
      fastening: "simple fastening",
      footwear: "simple leather footwear",
      condition: "practical and unremarkable",
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// IDENTIDADES DOMINANTES
// ═══════════════════════════════════════════════════════════════════════════

type Identity = {
  id: string;
  faithExpressed: boolean;
  cultureExpressed: boolean;
  colorsExpressed: boolean; // identidade já define as cores do traje
  subject?: string;
  faceAddon?: string;
  outfit?: string;
  appearance?: string;
  equipment?: string;
  poseFamily?: string;
};

function resolveIdentity(ctx: Ctx): Identity | null {
  const { sp, prof, faith, culture, isFemale, quality } = ctx;

  // ── 1. CLÉRIGO / MONGE — Cristo + ofício religioso (Palavra ou Véu) ──────
  if (faith === "cristo" && (prof === "palavra" || prof === "veu")) {
    const isScribe = prof === "palavra";

    const rankOutfit: Record<string, string> = {
      servo:         `humble monastic habit of coarse undyed wool, ${quality.condition}, belted with a worn rope cincture; ${quality.footwear} — the poorest servant of the church`,
      "homem-livre": "coarse grey or undyed wool habit, simple rope or leather belt, plain sandals or bare feet — poverty chosen deliberately",
      guerreiro:     "plain grey wool habit worn with the bearing of a former fighting man, simple leather belt, sturdy boots — the one trace of his old life",
      nobre:         "fine grey or white wool tunic of quality far above a common monk — spiritual authority dressed with restraint but not poverty",
    };

    const scribeKit = [
      "parchment codex carried with reverence — the center of his world",
      "ink horn and bone stylus at the belt",
      maybe(0.7, "ink stains on the fingertips — permanent marks of the work"),
    ];
    const priestKit = [
      pick([
        "ash walking staff with a small cross carved near the top, worn smooth from years of use",
        "knotted blackthorn staff, a small discreet chi-rho mark near the grip — visible only up close",
        "plain straight oak staff, unadorned, the tool of a traveling holy man",
      ]),
      pick([
        "vial of holy oil on a cord at the neck",
        "pouch of healing herbs at the belt — practical medicine alongside prayer",
        "rolled linen bandages and a small clay cup at the belt — the healer's working kit",
      ]),
      maybe(0.5, "small psalter tucked into the belt pouch"),
    ];
    const crossByRank = ctx.sp === "nobre"
      ? "prominent bronze or silver cross at the neck — larger than a common monk's"
      : "simple wooden cross pendant at the neck, worn smooth from daily handling";

    return {
      id: isScribe ? "monge-escriba" : "sacerdote-curandeiro",
      faithExpressed: true,
      cultureExpressed: true,
      colorsExpressed: true,
      faceAddon: isFemale
        ? ". Hair fully covered by a plain linen veil — the consecrated woman's modesty"
        : ". Celtic tonsure — front of head shaved from ear to ear, long hair at the nape",
      outfit: rankOutfit[sp] ?? rankOutfit["homem-livre"],
      appearance: joinParts([
        sp === "nobre"
          ? "the posture of someone obeyed in two spheres, spiritual and secular"
          : "humble but firm posture, unhurried presence — authority that comes from faith, not position",
        "no pagan amulets, no torc, no prestige ornament of any kind — the cross is the only adornment",
        culture === "romanizado"
          ? maybe(0.7, "the composed, deliberate bearing of a man shaped by Latin learning")
          : maybe(0.7, "the weathered simplicity of the Celtic church — faith lived outdoors, among the people"),
      ]),
      equipment: joinParts([crossByRank, ...(isScribe ? scribeKit : priestKit)]),
      poseFamily: isScribe ? "palavra" : "veu",
    };
  }

  // ── 2. DRUIDA / VIDENTE PAGÃO — Deuses Antigos + Véu ─────────────────────
  if (faith === "deuses-antigos" && prof === "veu") {
    const arcaico = culture === "tradicional";
    return {
      id: arcaico ? "feiticeiro-arcaico" : "vidente-pagao",
      faithExpressed: true,
      cultureExpressed: true,
      colorsExpressed: true,
      faceAddon: arcaico
        ? (isFemale
            ? ". Ritual woad markings on cheekbones and forehead — ceremonial paint, an intense and unsettling gaze"
            : ". Dark ink spiral tattoos around the eyes and along the jaw, otherworldly gaze")
        : maybe(0.3, isFemale
            ? ". Faint ritual woad mark at the brow, nearly washed away"
            : ". A faded spiral tattoo at the temple, half-hidden by hair"),
      outfit: arcaico
        ? pick([
            "wool robe in woad blue and ochre red, animal hide wrapped over one shoulder, feathers and bone at the fastenings — a figure from before the world changed",
            "layered garments of natural and wild-sourced materials: hide, bone, feathers; robe fastened asymmetrically, no conventional fibula",
          ])
        : `sober wool robe in muted grey-brown over ${ctx.quality.fabric}, fastened in an unconventional asymmetric way — respectable at a distance, unsettling up close`,
      appearance: arcaico
        ? "the appearance of someone who belongs to a prior world that refuses to disappear — outside every social category"
        : "an unsettling stillness — present but elsewhere; passes for ordinary until the eyes give it away",
      equipment: joinParts([
        arcaico
          ? "staff hung with sacred objects: perforated stones, carved bones, an oak branch with mistletoe"
          : pick([
              "carved staff of blackthorn wood, worn smooth at the grip",
              "ash staff, notched with counting marks, tip iron-shod",
            ]),
        joinParts(pickSome([
          "bronze cast raven pendant",
          "perforated stone witch-eye charm on a cord",
          "bundle of dried herbs and bones at the belt",
          "pouch of casting stones at the hip",
        ], arcaico ? 2 : 1, arcaico ? 3 : 2)),
      ]),
      poseFamily: "veu",
    };
  }

  // ── 3. INICIADO DE MITRA — Mitraísmo + (Lança ou posição Guerreiro) ──────
  if (faith === "mitraismo" && (prof === "lanca" || sp === "guerreiro")) {
    return {
      id: "iniciado-de-mitra",
      faithExpressed: true,
      cultureExpressed: false,
      colorsExpressed: false,
      faceAddon: ". A disciplined, closed expression — the initiated man who reveals nothing",
      appearance: "posture of exceptional military discipline; total economy of gesture — nothing external betrays the faith of the initiated",
      equipment: joinParts([
        prof === "lanca" ? (ctx.hasShield
          ? "ash-shafted spear, iron tip, worn leather grip; round Celtic shield, iron boss, arm-grip worn smooth"
          : "ash-shafted spear, iron tip, worn leather grip; seax long knife at the belt") : "",
        "knife with a carefully worked ritual handle at the hip — beyond the functional seax",
        maybe(0.8, "subtle sun or star motif engraved on belt buckle or personal ring — the only visible mark of initiation"),
        maybe(0.4, "Phrygian felt cap in red or ochre tucked carefully inside the cloak — never displayed in public"),
      ]),
      poseFamily: prof === "lanca" ? "lanca" : undefined,
    };
  }

  // ── 4. CURANDEIRO DAS DUAS VIAS — Fé Dividida + Arte ─────────────────────
  if (faith === "fe-dividida" && prof === "arte") {
    return {
      id: "curandeiro-duas-vias",
      faithExpressed: true,
      cultureExpressed: false,
      colorsExpressed: false,
      equipment: joinParts([
        "herb pouches at the belt alongside a small wooden cross on the same cord as a plant amulet",
        "small surgical knife; wooden cup and rolled linen bandages at the belt",
        maybe(0.6, "a stone with Chi-Rho engraved, kept alongside a sprig of protective herbs"),
      ]),
      appearance: "the practical, unadorned manner of someone who serves two traditions without anxiety — no dramatic amulets, no prestige markers",
    };
  }

  // ── 5. SENHOR DA GUERRA — Nobre + Lança ──────────────────────────────────
  if (sp === "nobre" && prof === "lanca") {
    const romano = culture === "romanizado";
    return {
      id: romano ? "cavaleiro-romano-bretao" : "chefe-celta",
      faithExpressed: false,
      cultureExpressed: true,
      colorsExpressed: true,
      outfit: romano
        ? pick([
            "chainmail hauberk over a dark red wool tunic — an armoured lord, not just a warrior",
            "lamellar leather armour with Roman-style bronze fittings over a fine wool tunic in deep ochre",
          ])
        : (ctx.hasCheckedCloak
            ? "fine wool tunic in deep woad blue — noble color, not the pale dye of commoners; the cloak alone carries a bold, clearly visible checked weave of woad blue and madder red, every other garment solid"
            : "high-quality wool tunic in saturated madder red over reinforced leather, cloak in solid moss green — this is not peasant cloth"),
      equipment: joinParts([
        "prestige sword at the hip in a worked leather scabbard with bronze fittings — alongside the ash spear",
        romano
          ? "round shield with a mixed Roman-Celtic painted emblem, well maintained"
          : "round shield painted with the clan emblem, well maintained",
        maybe(0.7, romano ? "iron helmet with nasal guard, Roman auxiliary style" : "bronze helmet, a piece of inherited equipment"),
        romano
          ? maybe(0.7, "gold crossbow fibula; ring with intaglio seal — authority in every detail")
          : "gold or silver torc at the neck — the mark of the Celt who has not forgotten who he is",
      ]),
      appearance: romano
        ? "commander's absolute authority — posture shaped by both Roman discipline and Celtic pride; battle scars on someone who did not have to fight but chose to"
        : "the loose, confident bearing of a war-chief among his own people; battle scars on someone who leads from the front",
      poseFamily: "lanca",
    };
  }

  // ── 6. BARDO DA CORTE / DAMA LETRADA — Nobre + Palavra ───────────────────
  if (sp === "nobre" && prof === "palavra") {
    return {
      id: isFemale ? "dama-letrada" : "bardo-da-corte",
      faithExpressed: false,
      cultureExpressed: false,
      colorsExpressed: false,
      outfit: `${quality.fabric}, cloak with embroidered edges fastened by ${isFemale ? "quality bronze or gold pins" : "a silver or gold fibula"} — the dress of someone kept close to power`,
      equipment: joinParts([
        isFemale
          ? "wax tablet or parchment held in both hands — remarkable for any woman of any class; stylus at the belt alongside the needle case"
          : pick([
              "small Celtic harp of carved yew wood, gut strings — the instrument of a patroned bard",
              "quality parchment codex in a leather satchel; wax tablet with ivory-handled stylus — gifts of patronage",
            ]),
        maybe(0.7, "ring with an engraved seal; fibula with a small inscription — marks of literary prestige"),
        maybe(0.6, "gold or silver torc — the intellectual's claim to noble status"),
      ]),
      appearance: isFemale
        ? "well-maintained hands with a faint ink stain on two fingers — the detail that reveals everything"
        : "well-maintained hands without callouses — the mark of someone who works exclusively with words and judgment",
      poseFamily: "palavra",
    };
  }

  // ── 7. GUERREIRO JURADO — posição Guerreiro + Lança ──────────────────────
  if (sp === "guerreiro" && prof === "lanca") {
    return {
      id: "combrogi",
      faithExpressed: false,
      cultureExpressed: false,
      colorsExpressed: false,
      equipment: joinParts([
        ctx.hasShield
          ? "round shield painted with the lord's mark alongside the ash spear — the sworn man's pair"
          : "ash spear and seax long knife — the sworn man's working tools, shield left with the baggage",
        maybe(0.8, "bronze arm ring — the visible sign of a sworn oath to a lord"),
        maybe(0.6, pick(["simple conical iron helmet", "hardened leather helmet, functional and repaired"])),
      ]),
      appearance: "reinforced leather with marks of repair and long use — functional, never decorative; scars earned in someone else's service",
      poseFamily: "lanca",
    };
  }

  // ── 8. LAVRADOR HUMILDE — Servo + Terra ──────────────────────────────────
  if (sp === "servo" && prof === "terra") {
    return {
      id: "lavrador-humilde",
      faithExpressed: false,
      cultureExpressed: true,
      colorsExpressed: true,
      outfit: "thick undyed coarse wool in natural brown, visibly patched and worn; no fibula — cloth tied with cord; bare feet or crude strap sandals; a woven straw hat as sole accessory",
      appearance: "hands destroyed by labor — calloused, cracked, dark with soil; posture curved by the earth; no jewelry, no weapons, no distinction of any kind",
      poseFamily: "terra",
    };
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// IMAGE PROMPT — instrução para o ChatGPT (fluxo oficial)
// ═══════════════════════════════════════════════════════════════════════════

export function buildImagePrompt(c: CharacterData, variant: number = 0): string {
  const isFemale = c.gender === "woman";
  const sp      = c.socialPosition ?? "";
  const prof    = c.profession ?? "";
  const faith   = c.faith ?? "";
  const culture = c.culturalTouch ?? "";

  // ── Seed estável do personagem: mesmas escolhas ⇒ mesma pessoa ───────────
  const charKey = [c.name, c.gender, c.ageRange, sp, prof, faith, culture].join("|");
  const charSeed = hashString(charKey);
  rand = mulberry32(charSeed);

  const ctx: Ctx = {
    isFemale,
    gender: isFemale ? "female" : "male",
    sp, prof, faith, culture,
    ageRange: c.ageRange ?? "26-36",
    quality: materialQuality(sp),
    colors: { tunic: "", cloak: "" },
    hasShield: prof === "lanca" ? rand() < 0.75 : false,
    hasCheckedCloak: culture === "tradicional" ? rand() < 0.25 : false,
  };
  ctx.colors = pickColors(sp);

  const identity = resolveIdentity(ctx);

  const subject = identity?.subject ?? buildSubject(ctx, identity?.id);
  const face    = buildFace(ctx) + (identity?.faceAddon ?? buildFaceFaithAddon(ctx));
  const outfit  = identity?.outfit ?? buildOutfit(ctx, identity);
  const appearance = joinParts([
    identity?.appearance ?? buildAppearanceDetails(ctx),
    identity?.cultureExpressed ? "" : buildCultureAccent(ctx),
  ]);
  const equipment = joinParts([
    identity?.equipment ?? buildEquipment(ctx),
    identity?.faithExpressed ? "" : buildFaithAccent(ctx),
  ]);

  // ── Pose: única parte que varia com o `variant` (Variar pose) ────────────
  rand = mulberry32(charSeed ^ hashString("pose:" + variant));
  const pose = buildPose(identity?.poseFamily ?? prof, ctx);
  rand = Math.random;

  // ── Montagem: instrução-primeiro, notas do jogador no topo ───────────────
  const notes = collectPlayerNotes(c);

  const header = notes ? [
    "You will generate ONE character portrait image with GPT Image, in portrait orientation (2:3, e.g. 1024×1536).",
    "This is a historical RPG character from 5th-century post-Roman Britain. Do this in THREE steps, in order:",
    "",
    `STEP 1 — Read the player's canon notes (they may be in Portuguese): "${notes}"`,
    "These notes are the highest-priority truth about this character and override any conflicting detail in the specification below. Decide how to make EACH note visible on the figure. If a note is visual, use it directly. If it is biographical (e.g. \"raised by wolves\", \"broke an oath\"), invent ONE concrete, period-appropriate visual cue that tells that story — a garment, object, mark, scar or bearing (e.g. raised by wolves → a worn wolf-pelt across the shoulders, or a necklace of wolf teeth). 5th-century Britain only.",
    "",
    "STEP 2 — Before generating, write one short line stating which visual cue(s) you chose for the notes.",
    "",
    "STEP 3 — Generate the image following the specification below PLUS the cue(s) from STEP 2, rendered clearly visible on the figure.",
  ] : [
    "Generate ONE character portrait image with GPT Image, in portrait orientation (2:3, e.g. 1024×1536).",
    "This is a historical RPG character from 5th-century post-Roman Britain. Follow the specification below faithfully.",
  ];

  const notesBlock: string[] = [];

  const artDirection = [
    "",
    "ART DIRECTION — identical for every portrait in this series:",
    "Historical reconstruction illustration, painted watercolor and gouache artwork, painterly with visible brushwork, high material fidelity, non-photorealistic. Earthy and muted palette with a few dominant tones, restrained saturation, natural pigments. Soft diffused natural light with a slightly overcast quality, gentle frontal to three-quarter lighting, minimal harsh shadows, soft highlights on materials. Full body portrait framing from head to toe, slight low-angle perspective, centered composition, single figure standing on the ground. Flat solid background color #eae2ce — no texture, no gradient, no parchment grain — only a subtle soft watercolor wash shadow directly beneath the figure's feet. Period accuracy: post-Roman Britain, 5th century AD — sub-Roman Britonnic culture, fading Roman legacy alongside resurgent Celtic tradition; clothing and equipment consistent with this period only. Mood: stoic, authoritative, historically reverent, documentary in tone, quiet strength and dignity.",
  ];

  const character = [
    "",
    "THE CHARACTER:",
    `Subject: ${subject}`,
    `Face: ${face}`,
    `Outfit: ${outfit}`,
    `Details: ${appearance || "practical appearance appropriate to their role and time"}`,
    `Equipment: ${equipment || "simple everyday objects appropriate to their role and time"}`,
    `Pose: ${pose}`,
    ...(notes ? [`Player canon (MUST be visibly represented — see STEP 1): "${notes}"`] : []),
  ];

  const constraints = [
    "",
    "HARD CONSTRAINTS:",
    "Single figure only. Full body visible from head to toe. Standing — never seated, kneeling or leaning on furniture. No furniture, no architecture, no environmental elements. No anachronisms, no fantasy elements. Not photorealistic. No oversaturated colors.",
  ];

  return [...header, ...notesBlock, ...artDirection, ...character, ...constraints].join("\n");
}

function collectPlayerNotes(c: CharacterData): string {
  return [c.socialPositionText, c.professionText, c.faithText, c.culturalTouchText, c.complementText]
    .map(t => t?.trim())
    .filter(Boolean)
    .join(" | ");
}

// ── Subject ─────────────────────────────────────────────────────────────────

function buildSubject(ctx: Ctx, identityId?: string): string {
  const identitySubjects: Record<string, string> = {
    "monge-escriba":          ctx.isFemale
      ? "monastic scribe standing with a parchment codex, hair veiled in plain linen, plainly dressed"
      : "monk-scribe standing with a parchment codex, tonsured and plainly dressed",
    "sacerdote-curandeiro":   ctx.isFemale ? "consecrated healer standing with staff and herb pouch, hair veiled in linen" : "traveling priest-healer standing with a cross-carved staff",
    "feiticeiro-arcaico":     "archaic sorcerer standing with a staff hung with bones and stones, marked face, otherworldly presence",
    "vidente-pagao":          "quiet seer standing with a carved staff, ordinary at a distance, unsettling up close",
    "iniciado-de-mitra":      "disciplined soldier standing at perfect ease, a closed expression that reveals nothing",
    "curandeiro-duas-vias":   "healer standing with herb pouches and bandage rolls, practical and unadorned",
    "cavaleiro-romano-bretao":"armoured warlord standing with spear and prestige sword, commander's bearing",
    "chefe-celta":            "Celtic war-chief standing with spear, torc at the neck, the bearing of inherited authority",
    "dama-letrada":           "noblewoman standing with a wax tablet in both hands, learned and self-possessed",
    "bardo-da-corte":         "court bard standing with a small Celtic harp, dressed above his apparent station",
    "combrogi":               ctx.hasShield
      ? "sworn warrior standing with spear and a shield painted with his lord's mark"
      : "sworn warrior standing with spear, seax at the belt",
    "lavrador-humilde":       "field laborer standing with a sickle at the belt, worn by work and weather",
  };

  if (identityId && identitySubjects[identityId]) {
    return `Single ${ctx.gender} ${identitySubjects[identityId]}, 5th-century post-Roman Britain`;
  }

  const lancaSubjects = ctx.hasShield
    ? [
        "warrior standing with spear and round shield",
        "armed warrior, spear in hand, shield slung on back",
        "seasoned fighter standing in a ready posture, spear raised, shield at the side",
      ]
    : [
        "warrior standing with spear, seax knife at the belt",
        "armed warrior at ease, spear over one shoulder",
      ];

  const desc: Record<string, string[]> = {
    lanca: lancaSubjects,
    palavra: [
      "bard standing with a small Celtic harp, mid-performance",
      "scribe standing with writing tablet and stylus, absorbed in thought",
      "storyteller gesturing while reciting, instrument at side",
    ],
    arte:    [
      "blacksmith standing with a hammer, leather apron, forge-darkened arms",
      "craftsperson standing and presenting a finished object, hands skilled and worn",
      "artisan healer standing with herb pouches, studying a remedy",
    ],
    veu:     [
      "seer standing with carved wooden staff and multiple amulets, otherworldly presence",
      "druid figure standing in stillness, gaze fixed on something unseen",
      "seer standing mid-ritual, arms partly raised, staff planted",
    ],
    terra:   [
      "farmer standing with sickle at belt, sun-darkened skin, steady gaze",
      "shepherd standing and leaning on a crook, steady watchful gaze",
      "fisherman standing with line at hip, practical and grounded",
    ],
  };
  const chosen = pick(desc[ctx.prof] ?? ["figure standing in a neutral pose"]);
  return `Single ${ctx.gender} ${chosen}, 5th-century post-Roman Britain`;
}

// ── Face ────────────────────────────────────────────────────────────────────

function buildFace(ctx: Ctx): string {
  const { isFemale, ageRange } = ctx;

  const ageDescriptors: Record<string, string> = {
    "11-15": "adolescent, early to mid teens, face still unformed, alert and watchful, youth not yet hardened by the world",
    "16-25": "young adult, late teens to mid-twenties, face unlined but already shaped by the first demands of life",
    "26-36": "prime of life, late twenties to mid-thirties, face weathered but vital, full authority of early maturity",
    "37-50": "mature, late thirties to late forties, lines deepening around eyes and jaw, earned experience written into every feature",
    "51-65": "older, fifties to early sixties, greying at the temples, the gravity of accumulated years, a face that has outlasted much",
  };
  const age = ageDescriptors[ageRange] ?? ageDescriptors["26-36"];
  const isYoungAge  = ["11-15", "16-25"].includes(ageRange);
  const isMatureAge = ["37-50", "51-65"].includes(ageRange);

  const skin = pick([
    "medium skin tone weathered and darkened by outdoor life",
    "light skin roughened by wind and sun",
    "warm brown complexion, sun-darkened over years",
    "olive skin tone, leathery from decades outdoors",
  ]);

  const expression = pick([
    "calm and resolute expression, eyes gazing steadily to the right",
    "watchful expression, eyes slightly narrowed, reading the horizon",
    "stern and composed, jaw set, a face that gives little away",
    "a rare stillness, the expression of someone accustomed to waiting",
    "slightly weary but unflinching, eyes that have seen much",
    "guarded composure, the expression of someone who trusts carefully",
  ]);

  let face: string;

  if (isFemale) {
    const hairBase = [
      "dark hair elaborately braided and pinned with bronze pins",
      "auburn hair in twin plaits",
      "black hair partly covered with a linen cloth, loose strands at the temples",
      "brown hair wound tight in a single long braid",
    ];
    if (isMatureAge) hairBase.push("grey-streaked dark hair pinned simply but neatly");
    if (ageRange === "51-65") hairBase.push("silver-grey hair drawn back tightly, a few dark strands remaining");
    const hair = pick(hairBase);
    face = `${age}, ${skin}, ${hair}. ${expression}`;

    const mark = maybe(0.3, pick([
      "A small scar at the jawline",
      "A faded blue-ink spiral tattoo at the wrist, barely visible",
      "High cheekbones accentuated by sun and wind",
    ]));
    if (mark) face += `. ${mark}`;

  } else {
    const hairBase = isYoungAge
      ? [
          "medium-length brown hair, light growth of beard or clean-shaven",
          "dark hair loosely worn, too young yet for a full beard",
          "auburn hair worn short, clean-shaven or with early stubble",
          "light brown hair wild and loose, soft new beard just growing in",
        ]
      : [
          "medium-length brown hair, short trimmed beard",
          "long dark hair tied back with a cord, full beard with thick side-braids",
          "auburn hair to the shoulders, mustache and short goatee",
          "black hair closely cropped, clean-shaven or light stubble",
          "light brown hair wild and loose, a few days of beard",
        ];
    if (isMatureAge) hairBase.push("grey-streaked hair worn loose, weathered full beard");
    if (ageRange === "51-65") hairBase.push("white-grey hair and long full beard, the distinguished weathering of decades");
    const hair = pick(hairBase);
    face = `${age}, ${skin}, ${hair}. ${expression}`;

    const mark = maybe(0.35, pick([
      "A healed scar crossing the brow",
      "A faded blue spiral tattoo on one cheek",
      "A broken nose reset at some point in the past",
      "A notched ear — old wound, long healed",
    ]));
    if (mark) face += `. ${mark}`;
  }

  // O Véu — marcações faciais (fora das identidades, que têm as suas)
  if (ctx.prof === "veu" && ctx.faith !== "cristo" && ctx.faith !== "deuses-antigos") {
    // Fé Dividida / Mitraísmo com Véu: sem marcação facial
  }

  return face;
}

function buildFaceFaithAddon(ctx: Ctx): string {
  let addon = "";
  if (ctx.faith === "cristo" && !ctx.isFemale) {
    addon += maybe(0.4, ". Celtic tonsure — front of head shaved from ear to ear, long hair at the nape");
  }
  if (ctx.faith === "mitraismo") {
    addon += ". A disciplined, closed expression — the initiated man who reveals nothing";
  }
  return addon;
}

// ── Outfit (caminho base, com qualidade + CORES CONCRETAS) ──────────────────

function buildOutfit(ctx: Ctx, identity: Identity | null): string {
  const { isFemale, prof, faith, culture, quality, colors } = ctx;

  // base de gênero SEM cor (cores entram cravadas logo abaixo)
  const genderBase = isFemale
    ? pick([
        "Long wool tunic to the ankles over a fine linen undershirt, overdress pinned at the shoulders, thin cloak with finished border edges",
        "Layered wool dress with linen undershirt visible at neck and wrists, cloak fastened at the shoulder, simple leather belt at the waist",
        "Long tunic belted at the waist, over-robe open at the front, cloak pinned asymmetrically at one shoulder",
      ])
    : pick([
        "Knee-length wool tunic with leather belt, wool bracae trousers tied below the knee with leather strips, heavy cloak fastened at the right shoulder",
        "Long-sleeved wool tunic belted with a wide leather strap, loose trousers tucked into cross-laced boots, short cloak over one shoulder",
        "Belted wool tunic over thick bracae, wrapped leather leggings, heavy cloak pinned at the chest",
      ]);

  // CORES CRAVADAS — uma cor por peça, sem ambiguidade.
  // A capa xadrez (trait estável) substitui a cor da capa quando presente.
  const colorLine = ctx.hasCheckedCloak
    ? `tunic in solid ${colors.tunic}; the cloak alone woven in a bold, clearly visible checked Celtic pattern of woad blue and madder red — every other garment plain solid wool`
    : (quality.tier === "servo"
        ? `all garments in ${colors.tunic} — no dyes, only what poverty allows`
        : `tunic dyed solid ${colors.tunic}; cloak in solid ${colors.cloak}`);

  const qualityLayer = joinParts([quality.fabric, quality.condition, quality.fastening, quality.footwear], ", ");

  const profDetail = maybe(0.7, pick(({
    lanca:   ["cloak folded back for readiness", "tanned leather with marks of use — functional not decorative"],
    palavra: ["clothing quality slightly above apparent social status — patronal gifts", "distinctive cloak with embroidered edges"],
    arte:    ["thick leather apron over the tunic", "practical work clothes showing signs of the trade"],
    veu:     faith === "fe-dividida"
      ? ["plain robe with one old amulet kept alongside newer habits", "simple wool garments, practical for travel between villages"]
      : ["garments of natural and wild-sourced materials: hide, bone, feathers", "robe fastened in an unconventional asymmetric way, no standard fibula"],
    terra:   ["woven straw hat or simple wool felt hat for sun", "thick-soled leather boots, reinforced soles"],
  } as Record<string, string[]>)[prof] ?? ["practical garments appropriate to the work"]));

  // acento cultural no traje — 1 item; padrões têxteis só via trait da capa
  let cultureDetail = "";
  if (!identity?.cultureExpressed) {
    if (culture === "romanizado") {
      cultureDetail = pick([
        "Roman-style crossbow fibula instead of the Celtic penannular",
        "Roman-style cingulum belt with buckle and decorated pendants",
        "paenula travel cloak cut, practical and unadorned",
        "leather bracers on the forearms, Roman auxiliary style",
      ]);
    } else if (culture === "tradicional" && !ctx.hasCheckedCloak) {
      cultureDetail = pick([
        "bronze penannular with spiral or animal-head terminals",
        "stacked arm rings in bronze and iron — identity worn in metal",
        "wide leather belt with hammered bronze plaques",
      ]);
    }
  }

  return joinParts([genderBase, colorLine, qualityLayer, profDetail, cultureDetail]);
}

// ── Appearance Details ──────────────────────────────────────────────────────

function buildAppearanceDetails(ctx: Ctx): string {
  const { isFemale, sp, prof, faith } = ctx;
  const pool: string[] = [];

  if (sp === "servo" && rand() < 0.7)
    pool.push(pick(["calloused hands and weathered skin from hard labor", "posture of someone accustomed to working bent over the earth", "a tiredness in the body that never fully leaves"]));

  if (sp === "nobre" && rand() < 0.7)
    pool.push(pick(["an ease of movement that comes from authority", "well-groomed hair, signs of having time for such things", "the erect bearing of someone accustomed to being obeyed"]));

  const profDetails: Record<string, string[]> = {
    lanca:   ["visible scars on hands or face — experience, not defeat", "a slight forward tilt of the head, the fighter's habit of assessment", "the economy of movement of someone trained not to waste it"],
    arte:    ["arms marked by sparks or burns, hands calloused and precise", "herb pouches and small tools hanging from the belt", "the focused look of someone who lives inside their craft"],
    veu:     ["long loose hair or completely shaved head", "multiple amulets at neck and wrist, each with its own history", "an unsettling stillness — present but elsewhere"],
    terra:   ["skin deeply tanned by sun, hands roughened by earth and tools", "a practical, grounded posture — nothing wasted in the body", "strong forearms from years of physical work"],
    palavra: ["ink stains on the fingertips or the musician's callouses", "eyes that are always watching, the bard's professional habit", "an expressive quality to the hands even at rest"],
  };
  const details = profDetails[prof] ?? [];
  if (details.length) pool.push(pick(details));

  if (ctx.culture === "tradicional" && faith === "deuses-antigos") {
    const tattooChance = prof === "lanca" ? 1.0 : 0.6;
    if (rand() < tattooChance)
      pool.push(pick([
        "dark woad-blue spiral tattoos on the forearms only — skin elsewhere unmarked",
        "spiral tattoos across the upper chest, visible at the tunic collar — arms and face unmarked",
      ]));
  }

  if (isFemale && rand() < 0.5)
    pool.push(pick(["bronze or bone bracelets at the wrists", "simple silver rings on two fingers", "bone and bronze pins holding the braids"]));

  return joinParts(pool);
}

// ── Acento cultural de porte ────────────────────────────────────────────────

function buildCultureAccent(ctx: Ctx): string {
  if (ctx.culture === "romanizado" && rand() < 0.6) {
    return pick([
      "hair closely cropped and kept in Roman fashion — no loose Celtic mane",
      "upright and slightly stiff bearing — the posture of someone shaped by Roman habits",
      "hands clean and well-maintained — the Roman concern for personal presentation",
    ]);
  }
  if (ctx.culture === "tradicional" && rand() < 0.6) {
    return pick([
      "lime-washed hair stiffened and swept dramatically back — warrior aesthetic unchanged for generations",
      "strong and loose bearing — no Roman stiffness, movement open and unguarded",
      "Celtic knotwork jewelry worn at the neck only — a single declared mark of identity",
    ]);
  }
  return "";
}

// ── Equipment (caminho base) ────────────────────────────────────────────────

function buildEquipment(ctx: Ctx): string {
  const { prof, sp } = ctx;
  const parts: string[] = [];

  if (prof === "lanca") {
    if (ctx.hasShield) {
      parts.push(pick([
        "Ash-shafted spear, iron tip, worn leather grip; long oval shield with central boss, leather-faced, painted in faded red or ochre",
        "Ash spear and round Celtic shield, iron boss, arm-grip worn smooth",
      ]));
    } else {
      parts.push("Ash-shafted spear, iron tip, worn leather grip; seax long knife at the belt — no shield carried today");
    }
    if (sp === "nobre")     parts.push(maybe(0.7, "Prestige sword at the hip in worked leather scabbard with bronze fittings"));
    if (sp === "guerreiro") parts.push(maybe(0.6, pick(["Simple conical iron helmet without visor", "Hardened leather helmet, nasal guard intact"])));

  } else if (prof === "palavra") {
    parts.push(pick([
      "Small Celtic harp of carved yew wood, gut strings",
      "Writing tablet and bone stylus, wax surface worn smooth",
      "Rolled parchment tucked under one arm, tied with cord",
    ]));
    parts.push(maybe(0.5, pick(["A ring with an engraved stone — patronal gift", "Fibula with a small literary inscription"])));

  } else if (prof === "veu") {
    parts.push(pick([
      "Carved staff of blackthorn wood, a small cross scratched near the grip alongside older spiral marks",
      "Oak staff with knotwork carvings — some Christian, some older and unnamed",
      "Ash staff, notched with counting marks, tip iron-shod",
    ]));
    parts.push(...pickSome([
      "Bundle of dried herbs at the belt — old habit, new prayers",
      "Perforated stone on a cord at the neck",
      "Pouch of casting stones, carried more from habit than belief now",
      "A small bird skull tied to the staff cord — meaning known only to the carrier",
    ], 1, 2));

  } else if (prof === "arte") {
    parts.push(pick([
      "Iron tongs at the belt, hammer head visible over the shoulder",
      "Herb gathering bag, small bronze knife at the belt",
      "Leather tool roll partially open, bone-handled instruments visible",
    ]));

  } else if (prof === "terra") {
    parts.push(pick([
      "Small sickle at belt, leather-handled and well-used",
      "Shepherd's crook of ash wood, notched from years of use",
      "Herding knife at belt, a short fishing line coiled at the hip",
    ]));
  }

  return joinParts(parts);
}

// ── Acento de fé ────────────────────────────────────────────────────────────

function buildFaithAccent(ctx: Ctx): string {
  const faithDetails: Record<string, string[]> = {
    "deuses-antigos": [
      "Bronze cast raven amulet at the neck",
      "Bronze stag or bull amulet hanging from belt",
      "Perforated stone witch-eye charm on a cord",
      "Celtic spiral knotwork engraved on belt or ring",
      "Small serpent cast in bronze at the wrist",
    ],
    cristo: [
      "Small wooden cross pendant at the neck — modest, not displayed",
      "Discreet bronze cross pendant, worn smooth from handling",
      "Chi-Rho engraved small on a personal ring — visible only up close",
      "Small ichthys fish scratched into the back of a belt fitting",
      "A knotted prayer cord wound around one wrist",
    ],
    "fe-dividida": [
      "Small wooden cross worn on the same cord as a bronze stag amulet — both faiths on one string",
      "Rowan sprig tied at the belt — old protection kept alongside new prayers",
      "A worn cross pendant and a perforated stone charm, worn together without ceremony",
      "Bronze fibula with a Celtic spiral terminal and a small cross scratched on the pin",
      "A river-stone offering kept in the belt pouch, beside a tiny carved cross",
    ],
    mitraismo: [
      "Small bronze amulet: raven or lion grade symbol",
      "Knife with a carefully worked ritual handle, kept at the hip",
      "Sun and star motif on a personal ring or belt fitting",
    ],
  };
  const pool = faithDetails[ctx.faith] ?? [];
  if (!pool.length) return "";
  return joinParts(pickSome(pool, 1, 2));
}

// ── Pose — vocabulário controlado, 100% em pé, varia com o `variant` ────────

function buildPose(family: string, ctx: Ctx): string {
  const lancaShield = [
    "Upright military stance, spear planted beside the right foot, weight shifted to one hip, shield hanging loose from left arm, gaze scanning the distance",
    "Three-quarter turn toward the viewer, spear gripped diagonally across the body, left hand on shield boss, quiet alertness in the posture",
    "Walking mid-stride with purpose, spear over the right shoulder, shield on the back, cloak trailing slightly with movement",
    "Standing straight and still, both hands on the spear shaft planted before them, shield resting against the leg — a quiet authority",
  ];
  const lancaNoShield = [
    "At rest — spear leaned against one shoulder, cloak gathered at the chest, one hand resting on the seax hilt, the other loose at the side",
    "Standing straight and still, both hands on the spear shaft planted before them, a quiet authority — the warrior who does not need to posture",
    "Three-quarter turn toward the viewer, spear held vertical in the right hand, left thumb hooked in the belt",
    "Walking mid-stride with purpose, spear over the right shoulder, cloak trailing slightly with movement",
  ];

  const poses: Record<string, string[]> = {
    lanca: ctx.hasShield ? lancaShield : lancaNoShield,
    palavra: [
      "Standing still, instrument or tablet held at chest height, fingers poised, absorbed in a moment of inner listening",
      "Standing mid-recitation, one arm extended in a sweeping gesture, scroll loosely held in the other hand",
      "Standing, looking up from the writing tablet, stylus paused in hand, a thought caught in mid-composition",
      "Standing at a slight angle, arms loosely crossed, the observer's patient watchfulness before speaking",
      "Standing with parchment unrolled in both hands, reading quietly, absorbed in the words on the page",
    ],
    arte: [
      "Standing with tool held at waist height, examining the work with a focused squint, slight forward bend at the waist",
      "Standing, arms crossed over the apron, surveying completed work with quiet satisfaction",
      "Standing mid-motion — tool raised, body turned into the action, caught in the act of making",
      "Standing and presenting a crafted object held in both hands, the craftsperson offering their work to be seen",
      "Standing back from the work, arms at sides, one hand still gripping a tool — the pause of assessment before the next move",
    ],
    veu: [
      "Standing perfectly still, staff held vertical before them, one hand raised palm-outward as if holding something invisible back",
      "Standing turned slightly away from the viewer, staff trailing, gaze fixed on the middle distance — seeing what others cannot",
      "Standing with arms slightly spread and head tilted back, a posture of listening to something inaudible",
      "Standing upright, both hands on the staff, eyes downcast — a posture of inner listening, weight evenly held",
      "Standing and facing the viewer directly, staff in left hand, right arm extended palm down — a gesture of warding or blessing",
    ],
    terra: [
      "Standing and leaning on the shepherd's crook, one arm draped over it, gaze sweeping the horizon with unhurried patience",
      "Standing, straightening up from work, one hand pressed to the lower back, looking forward with a steady gaze",
      "Walking back from the fields, tools over one shoulder, the easy gait of someone returning home",
      "Standing still, arms loosely at sides, reading the weather in the sky above",
      "Standing and facing the viewer with hands wrapped around the shaft of a tool, the quiet confidence of someone rooted in their work",
    ],
  };

  const familyPoses = poses[family] ?? [
    "Upright standing pose, weight balanced evenly, neutral and composed stance",
    "Three-quarter turn, standing relaxed but present, figure fully visible",
  ];

  let chosen = pick(familyPoses);

  if (ctx.isFemale) {
    chosen += maybe(0.3, pick([
      ", cloak gathered in one hand at the chest",
      ", the long dress lying still around the feet",
      ", hair pins catching the diffuse light",
    ]));
  }

  return chosen;
}

// ═══════════════════════════════════════════════════════════════════════════
// TEXT PROMPT — apresentação narrativa do personagem
//
// Usa os textos ricos do character-data como contexto, o arquétipo resolvido
// pelo mesmo motor da imagem (coerência imagem ↔ texto), e instruções de
// estilo concretas no tom Cornwell. Notas do jogador são canônicas.
// ═══════════════════════════════════════════════════════════════════════════

const SEP = "\n────────────────────\n";

// Arquétipos em português para o prompt de texto (mesmo resolutor da imagem)
const IDENTITY_PT: Record<string, string> = {
  "monge-escriba":           "Monge-escriba — a fé e o texto dominam sua identidade; a vida inteira organizada em torno da palavra copiada e rezada",
  "sacerdote-curandeiro":    "Sacerdote-curandeiro itinerante — um homem (ou mulher consagrada) da igreja que anda entre vilas, parte cura, parte confissão",
  "feiticeiro-arcaico":      "Feiticeiro das antigas vias — pertence a um mundo anterior que recusa desaparecer; fora de toda categoria social",
  "vidente-pagao":           "Vidente discreto dos deuses antigos — comum à distância, inquietante de perto",
  "iniciado-de-mitra":       "Soldado iniciado no culto secreto de Mitra — disciplina total, fé invisível, irmandade silenciosa",
  "curandeiro-duas-vias":    "Curandeiro das duas vias — serve às duas fés sem ansiedade; prático acima de tudo",
  "cavaleiro-romano-bretao": "Senhor da guerra romano-bretão — autoridade herdada de Roma, orgulho herdado dos celtas",
  "chefe-celta":             "Chefe de guerra céltico — autoridade de linhagem, o torque no pescoço como declaração",
  "dama-letrada":            "Dama letrada — mulher rara que domina a palavra escrita num mundo que não esperava isso dela",
  "bardo-da-corte":          "Bardo de corte — vive sob patronato; sua palavra sustenta e ameaça reputações",
  "combrogi":                "Guerreiro jurado — o juramento é o centro de tudo; vive e morre pela palavra dada",
  "lavrador-humilde":        "Lavrador servo — o mais invisível dos bretões, e por isso vê o que ninguém repara",
};

function findDescription(config: { options: { id: string; description: string }[] }, id: string): string {
  return config.options.find(o => o.id === id)?.description ?? "";
}

export function buildTextPrompt(c: CharacterData): string {
  const genderPt = c.gender === "woman" ? "mulher" : "homem";

  const sp      = c.socialPosition ?? "";
  const prof    = c.profession ?? "";
  const faith   = c.faith ?? "";
  const culture = c.culturalTouch ?? "";
  const ageRange = c.ageRange ?? "26-36";

  // labels
  const spLabel: Record<string, string> = {
    servo: "Servo (Taeog)", "homem-livre": "Homem Livre (Bonheddwr)",
    guerreiro: "Guerreiro Jurado (Combrogi)", nobre: "Nobre (Uchelwr)",
  };
  const profLabel: Record<string, string> = {
    lanca: "A Lança", palavra: "A Palavra", arte: "A Arte", veu: "O Véu", terra: "A Terra",
  };
  const faithLabel: Record<string, string> = {
    "deuses-antigos": "Os Deuses Antigos", cristo: "O Cristo",
    "fe-dividida": "A Fé Dividida", mitraismo: "O Mitraísmo",
  };
  const cultureLabel: Record<string, string> = {
    romanizado: "Mais Romanizado", tradicional: "Mais Tradicional",
  };

  // textos ricos do jogo (mesmos que o jogador leu ao escolher)
  const spDesc      = findDescription(socialPositionConfig, sp);
  const profDesc    = findDescription(professionConfig, prof);
  const faithDesc   = findDescription(faithConfig, faith);
  const cultureDesc = findDescription(culturalTouchConfig, culture);
  const ageOption   = ageRangeOptions.find(o => o.id === ageRange);
  const genderDesc  = c.gender ? genderDescriptions[c.gender] : "";

  // arquétipo — mesmo resolutor da imagem, para coerência imagem ↔ texto
  const charKey = [c.name, c.gender, c.ageRange, sp, prof, faith, culture].join("|");
  rand = mulberry32(hashString(charKey));
  const ctxForIdentity: Ctx = {
    isFemale: c.gender === "woman",
    gender: c.gender === "woman" ? "female" : "male",
    sp, prof, faith, culture,
    ageRange,
    quality: materialQuality(sp),
    colors: { tunic: "", cloak: "" },
    hasShield: false,
    hasCheckedCloak: false,
  };
  const identity = resolveIdentity(ctxForIdentity);
  rand = Math.random;
  const archetype = identity ? IDENTITY_PT[identity.id] : "";

  const playerNotes = [
    c.socialPositionText?.trim() && `Sobre a origem social: "${c.socialPositionText.trim()}"`,
    c.professionText?.trim() && `Sobre o ofício: "${c.professionText.trim()}"`,
    c.faithText?.trim() && `Sobre a fé: "${c.faithText.trim()}"`,
    c.culturalTouchText?.trim() && `Sobre a herança cultural: "${c.culturalTouchText.trim()}"`,
    c.complementText?.trim() && `Anotações gerais: "${c.complementText.trim()}"`,
  ].filter(Boolean) as string[];

  const lines: string[] = [
    `TAREFA`,
    `Escreva a descrição de apresentação de um personagem de RPG histórico: quem ele é, de onde vem, o que faz e em que situação está. O texto vai para a ficha do personagem — precisa informar o jogador, não impressioná-lo.`,
    SEP,
    `AMBIENTAÇÃO`,
    `Britânia, século V d.C., período pós-romano. Roma recuou há uma geração. Os saxões pressionam pelo leste — homens que não pedem terra: tomam. Os reinos bretões tentam sobreviver entre a herança latina que se apaga e as raízes celtas que ressurgem. A vida se organiza em vínculos: o senhor protege, o guerreiro serve, o homem livre paga tributo, o servo sobrevive. Um juramento pesa mais que ferro.`,
    ``,
    `TOM`,
    `Prosa narrativa sóbria e direta, historicamente ancorada — pense num bom texto de ficha de RPG, não num conto literário. Referência distante: Bernard Cornwell (As Crônicas de Arthur), mas na versão "historiador contando uma vida", não na versão "romancista abrindo capítulo". Informação concreta acima de imagem poética.`,
    SEP,
    `O PERSONAGEM`,
    `Nome: ${c.name || "(sem nome)"}`,
    `Gênero: ${genderPt}`,
    genderDesc ? `Contexto de gênero nesta época: ${genderDesc}` : ``,
    ``,
    `Idade: ${ageOption?.label ?? ageRange} — ${ageOption?.description ?? ""}`,
    ``,
    `Posição social: ${spLabel[sp] ?? sp}`,
    spDesc,
    ``,
    `Ofício: ${profLabel[prof] ?? prof}`,
    profDesc,
    ``,
    `Fé: ${faithLabel[faith] ?? faith}`,
    faithDesc,
    ``,
    `Herança cultural: ${cultureLabel[culture] ?? culture}`,
    cultureDesc,
  ];

  if (archetype) {
    lines.push(
      ``,
      `ARQUÉTIPO RESOLVIDO`,
      `As escolhas acima convergem para uma identidade clara: ${archetype}. Deixe essa identidade dominar o retrato — não trate as escolhas como atributos separados.`,
    );
  }

  if (playerNotes.length) {
    lines.push(
      SEP,
      `PALAVRAS DO JOGADOR — CANÔNICAS, PRIORIDADE MÁXIMA`,
      `O jogador escreveu os detalhes abaixo. Eles são a verdade mais importante sobre o personagem: têm prioridade sobre qualquer inferência sua e DEVEM ser incorporados como FATOS da história dele (não como lista, não entre aspas, sem mistério em volta).`,
      ...playerNotes,
    );
  }

  lines.push(
    SEP,
    `INSTRUÇÕES DE ESCRITA`,
    `- 4 parágrafos, 220 a 300 palavras no total, em TERCEIRA PESSOA (use o nome do personagem e ele/ela)`,
    `- Parágrafo 1: quem ${c.name || "o personagem"} é hoje — nome, idade aproximada, posição social, ofício e onde vive. Apresentação direta, fatos primeiro`,
    `- Parágrafo 2: origem e trajetória — de onde veio, como chegou a este ofício e posição, eventos concretos que o marcaram`,
    `- Parágrafo 3: fé e cultura no cotidiano — como pratica, em que acredita, como isso aparece no dia a dia e nas relações dele`,
    `- Parágrafo 4: situação atual — o que faz agora, o que o move, e um gancho aberto para aventura (uma tensão ou tarefa pendente, sem resolver)`,
    `- Estilo: sóbrio, claro e informativo; narrativa como tempero, não como prato. No MÁXIMO uma imagem figurada por parágrafo — o resto é informação concreta: lugares, eventos, pessoas, relações`,
    `- Use termos do contexto quando natural (taeog, salão do senhor, parede de escudos), sem exotizar`,
    `- PROIBIDO: abertura in medias res ou cena sensorial; mistério vago; frases de efeito; "em um mundo onde..."; "tempos sombrios"; "seu destino o aguarda"; segunda pessoa; presente dramático ("a pena raspa no pergaminho"); elementos fantásticos além do que a época admite`,
    `- Escreva em português do Brasil`,
  );

  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}
