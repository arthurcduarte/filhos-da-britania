import type { AttributeConfig, AgeRange } from "@/types/character";

// ── Faixa Etária ─────────────────────────────────────────────────────────────
export const ageRangeOptions: { id: AgeRange; label: string; description: string }[] = [
  {
    id: "11-15",
    label: "11–15 anos",
    description:
      "Jovem ainda em formação — aprendiz, escudeiro ou filho de servo sem posto. O mundo lhe pede menos, mas observa com atenção o que está sendo feito desta matéria bruta.",
  },
  {
    id: "16-25",
    label: "16–25 anos",
    description:
      "O momento das primeiras escolhas reais. Juramentos feitos, batalhas iniciais, ofícios aprendidos no limite do que o corpo aguenta. A vida começa a deixar marcas visíveis.",
  },
  {
    id: "26-36",
    label: "26–36 anos",
    description:
      "Pleno vigor. O personagem já sabe quem é — e o mundo já sabe quem ele é. As responsabilidades crescem junto com a reputação.",
  },
  {
    id: "37-50",
    label: "37–50 anos",
    description:
      "Maturidade com peso. Cada cicatriz tem história, cada decisão já custou algo. A experiência compra o que a força jovem não pode. As escolhas de uma vida inteira começam a cobrar sua fatura.",
  },
  {
    id: "51-65",
    label: "51–65 anos",
    description:
      "Poucos chegam até aqui — e os que chegam carregam mais história do que a maioria consegue imaginar. A autoridade não precisa mais ser declarada: simplesmente está lá.",
  },
];

// ── Tela 1 — Apresentação Geral ─────────────────────────────────────────────
export const introText1 = {
  title: "Filhos da Britânia",
  body: `"Nós sempre estivemos aqui. Descendentes dos antigos. Os bretões sempre foram um povo de tribos — espalhados pela ilha em reinos pequenos, cada um com seus costumes, seus deuses e suas disputas. Somos filhos desta terra: das colinas, dos rios, dos bosques antigos. Cada pedra tem memória, cada caminho já foi trilhado por alguém cujo nome ainda ecoa nas histórias.

Então Roma chegou, e por quase quatro séculos a ilha respirou num ritmo diferente: estradas cortando florestas, cidades crescendo onde havia colinas, o latim entrando nos salões dos nobres junto com o vinho e a lei escrita. Como dizia um velho sábio, as tribos eram mais diferentes entre si — os romanos nos fizeram todos mais parecidos.

Mas até isso mudou. Quando Roma partiu, levada pelas suas próprias crises, o que ficou foi seu vazio — estradas e pontes que ainda usamos, mas já não sabemos erguer como antes, ruínas que lembram mais do que ensinam, e a memória de um mundo que não existe mais. E, junto disso, a necessidade urgente de nos governarmos sozinhos.

Agora, entre reinos que se reorganizam e fronteiras que mudam com cada estação, surge mais uma ameaça. Os saxões começam a aparecer, vindos do mar do leste — homens duros, de deuses estrangeiros e costumes estranhos, que não pedem terra: tomam. Onde chegam, queimam, fincam raízes e não partem. E a cada inverno, parecem vir em maior número."`,
  cta: "Começar a Jornada",
};

// ── Tela 2 — Apresentação Social/Cultural ───────────────────────────────────
export const introText2 = {
  title: "O Mundo que Você Habita",
  body: `"O mundo de um bretão tem o tamanho que seus olhos alcançam: a vila, os campos, a floresta que ninguém atravessa depois do anoitecer.

A vida se organiza em vínculos. O senhor protege; o guerreiro serve; o homem livre trabalha e paga seu tributo; o servo sobrevive como pode. Cada homem conhece seu lugar — e o lugar dos outros.

No centro de tudo está o salão do senhor — não porque seja belo, mas porque é onde o fogo aquece o inverno, onde a cerveja de mel circula e onde as palavras que importam são ditas diante de testemunhas. É ali que se fazem juramentos, e um juramento aqui pesa mais que ferro. Quebrar a palavra dada é uma morte pior que a da batalha — a morte do nome, da honra, de tudo que faz um homem ser lembrado.

As estações governam o resto. A colheita ruim mata os descuidados. O inverno leva os fracos. A guerra vem quando vem, e ninguém a ignora.

E há ainda aquilo que não se vê, mas nunca se esquece. Os deuses antigos vivem nos rios e nos bosques, e pedem — às vezes — algo em troca. O Cristo promete salvação e redenção, e há quem diga que sua presença já mudou esta terra. Mas quando a chuva não vem ou a doença bate à porta, poucos arriscam confiar em um único caminho. Por isso, muitos não escolhem. Rezam quando precisam, oferece quando temem.

É um mundo de laços reais, honras guardadas e histórias que sobrevivem mais que os homens que as viveram."`,
  cta: "Criar meu Personagem",
};

// ── Gênero ───────────────────────────────────────────────────────────────────
export const genderDescriptions = {
  man: "Na Britânia do século V, nascer homem é nascer dentro de uma expectativa que não pede permissão. Os caminhos estão traçados: a lança, o campo, o salão, o juramento. Mas dentro dessa estrutura há escolha — e é o que um homem faz com o lugar que herda que define quem ele se torna. O peso das obrigações é real, e também o é a liberdade de carregá-las com coragem ou com sabedoria.",
  woman:
    "A lei celta, diferente do que viria depois, reconhecia às mulheres direitos que muitos povos do continente nem imaginavam: herdar terra, romper um casamento, exercer autoridade por mérito próprio. Cartimandua governou os Brigantes com mão de ferro. Boudica levou quase toda a ilha à revolta. No salão, na câmara do curandeiro, na floresta onde os presságios são lidos — o poder de uma mulher segue caminhos menos visíveis que o da espada, mas não menos reais. Alguns caminhos exigem que ela os abra sozinha. Isso também é uma forma de força.",
};

// ── Posição Social ───────────────────────────────────────────────────────────
export const socialPositionConfig: AttributeConfig = {
  title: "Posição Social",
  subtitle: "De onde você vem determina quem você é — mas não precisa ser o fim da história.",
  options: [
    {
      id: "servo",
      label: "Servo",
      subtitle: "Taeog",
      description:
        "O taeog trabalha a terra de outro homem, dorme sob o teto de outro homem, responde ao nome de outro homem quando os cobradores passam. Mas a servidão não apaga o que uma pessoa carrega dentro de si. Há servos que conhecem os segredos do salão melhor que qualquer guerreiro. Há os que guardam silêncio por anos antes de agir — e quando agem, o mundo ao redor não estava preparado.",
    },
    {
      id: "homem-livre",
      label: "Homem Livre",
      subtitle: "Bonheddwr",
      description:
        "O homem livre é a espinha da vila. Tem terra própria, voz própria, e deve obediência — mas dentro de limites que a lei reconhece. Paga tributo e pode ser convocado à guerra, mas não pertence a ninguém. É o estado mais comum, e também o mais invisível: o mundo o pressupõe sem lhe dar crédito. Mas os que emergem dessa invisibilidade, quando emergem, costumam surpreender.",
    },
    {
      id: "guerreiro",
      label: "Guerreiro Jurado",
      subtitle: "Combrogi",
      description:
        "O guerreiro jurado entregou mais que sua lança — entregou seu nome ao serviço de um senhor. Em troca: armas, abrigo, camaradagem, e a promessa de glória. O juramento é o centro de tudo. Quebrar a palavra dada é uma desonra que nenhuma vitória futura apaga. Viver por ele é servir, às vezes contra a própria vontade. Morrer por ele é, dizem os bardos, o único fim digno de um homem de lança.",
    },
    {
      id: "nobre",
      label: "Nobre",
      subtitle: "Uchelwr",
      description:
        "O nobre responde por seu povo — e essa responsabilidade tem dentes. Mantém o salão, distribui o que tem, resolve as disputas e conduz os homens à guerra quando o senhor acima dele chama. Um nobre generoso é lembrado em canção. Um nobre covarde ou mesquinho perde guerreiros antes mesmo de perder batalhas. O poder aqui não é privilégio passivo — é um peso que se carrega acordado e dormindo.",
    },
  ],
};

// ── Ofício ───────────────────────────────────────────────────────────────────
export const professionConfig: AttributeConfig = {
  title: "Ofício",
  subtitle: "O que você faz define o que você vale — e o que o mundo espera de você.",
  options: [
    {
      id: "lanca",
      label: "A Lança",
      description:
        "O guerreiro é a figura mais visível do mundo bretão — e também a mais exigida. Treinar desde jovem, conhecer o peso do escudo, saber onde ficar no muro de lanças sem precisar pensar. Mas a guerra no século V não é só combate: é lealdade, é posicionamento, é saber de que lado estar quando os reinos começam a se partir. A lança mata — mas é a cabeça que decide quando erguê-la, e para quem.",
    },
    {
      id: "palavra",
      label: "A Palavra",
      description:
        "Num mundo onde poucos leem e menos ainda escrevem, quem controla a palavra controla a memória. O bardo imortalizou reis em canção — e destruiu reputações com a mesma facilidade. O mensageiro carrega não só notícias, mas a confiança de quem o enviou. O escriba que domina o latim tem acesso a um mundo que os outros mal imaginam. A palavra não deixa cicatriz visível — mas seus golpes duram mais que qualquer ferimento de espada.",
    },
    {
      id: "arte",
      label: "A Arte",
      description:
        "O ferreiro que forja a espada é tão essencial quanto quem a empunha — e nas histórias antigas, muitas vezes mais poderoso. O curandeiro que conhece as ervas certas pode devolver à vida quem a batalha tentou levar. O construtor ergue os salões onde o poder é exercido. Numa sociedade onde cada ofício é legado, transmitido de geração em geração, quem domina uma arte tem um lugar garantido em qualquer vila — e uma autoridade silenciosa que poucos ousam questionar.",
    },
    {
      id: "veu",
      label: "O Véu",
      description:
        "Há um mundo além do que os olhos alcançam — e há pessoas que sabem navegar nele. O vidente que lê os presságios antes da batalha pode mudar o resultado dela sem empunhar nada. A sábia que conhece os nomes antigos carrega uma autoridade que nenhum senhor concede: ela simplesmente tem. O druida — raro, excêntrico, imprevisível — não serve a nenhum rei, mas reis o consultam. Quem trabalha com o invisível nunca é completamente de dentro do mundo — e nunca é completamente de fora.",
    },
    {
      id: "terra",
      label: "A Terra",
      description:
        "O agricultor, o pastor, o pescador — são eles que alimentam todos os outros, e os primeiros a sentir quando algo muda. Conhecem o ritmo das estações melhor que qualquer rei, sabem onde o rio sobe antes das chuvas e quando o vento anuncia inverno cedo. É um ofício que o mundo pressupõe e raramente celebra — mas sem ele, o salão do senhor esvazia num único inverno. E quem conhece a terra conhece caminhos, esconderijos e verdades que os guerreiros nunca param para notar.",
    },
  ],
};

// ── Fé ───────────────────────────────────────────────────────────────────────
export const faithConfig: AttributeConfig = {
  title: "Fé",
  subtitle: "Em quem você acredita diz tanto sobre você quanto o que você carrega.",
  options: [
    {
      id: "deuses-antigos",
      label: "Os Deuses Antigos",
      description:
        "Antes de Roma, os bretões já cultuavam um mundo vivo. Lugh, senhor das habilidades e da luz; Bel ou Belenos, ligado ao sol e aos ciclos; Cernunnos, o deus dos animais e das florestas; além de incontáveis espíritos locais — das fontes, dos rios, das colinas. Não há templos grandiosos, mas há lugares: uma árvore marcada, uma pedra erguida, uma nascente onde oferendas são deixadas. Presságios são lidos no voo dos pássaros, nas entranhas de um animal abatido ou no silêncio repentino de um bosque. É uma fé de prática, não de doutrina. Saber quando oferecer, onde pisar, o que evitar — isso importa mais do que qualquer explicação sobre os deuses.",
    },
    {
      id: "cristo",
      label: "O Cristo",
      description:
        "O cristianismo na Britânia do século V é fragmentado, mas persistente. Sem a estrutura romana, a fé se organiza em pequenas comunidades, muitas vezes centradas em uma capela simples ou na presença de um monge ou sacerdote. A mensagem enfatiza um deus único, a ideia de pecado e redenção, e uma vida que se estende além da morte. Há também figuras devotas fora da hierarquia formal — eremitas, curandeiros, pregadores itinerantes — que interpretam a fé à sua maneira. Não existe uma única igreja, mas várias expressões de uma mesma crença.",
    },
    {
      id: "fe-dividida",
      label: "A Fé Dividida",
      description:
        "Para muitos, não há separação clara entre antigo e novo. O mesmo homem que faz o sinal da cruz pode deixar uma oferenda numa fonte antes de uma viagem. Amuletos são usados ao lado de símbolos cristãos. Orações convivem com rituais herdados. Em tempos de crise — doença, guerra, fome — é comum recorrer a mais de uma forma de proteção. Essa convivência não é vista necessariamente como contradição, mas como continuidade. O mundo mudou, mas nem tudo foi abandonado. Em muitas vilas, essa é simplesmente a forma como as coisas são feitas.",
    },
    {
      id: "mitraismo",
      label: "O Mitraísmo",
      description:
        "O culto de Mithras chegou com os soldados romanos e se espalhou pelos quartéis e fronteiras do Império. É uma fé iniciática e secreta — seus seguidores se reconhecem pelo aperto de mão e pelo silêncio mantido diante de estranhos. Mithras é o deus da luz que nasce da escuridão, do sacrifício necessário, da irmandade forjada em lealdade. Com a partida de Roma e a ascensão do Cristo, o culto foi proibido — mas na Britânia isolada, distante dos decretos imperiais, alguns ainda guardam os ritos. São poucos, são discretos, e carregam a memória de um mundo que o mundo oficial prefere esquecer.",
    },
  ],
};

// ── Toque Cultural ───────────────────────────────────────────────────────────
export const culturalTouchConfig: AttributeConfig = {
  title: "Toque Cultural",
  subtitle: "A herança que você carrega moldou o jeito como você enxerga o mundo.",
  options: [
    {
      id: "romanizado",
      label: "Mais Romanizado",
      description:
        "Há famílias que ainda guardam o latim como herança — não como língua viva, mas como sinal de que seus antepassados tocaram um mundo maior. O romanizado conhece lei escrita, talvez saiba ler, talvez guarde na memória a planta de uma villa que já não existe mais. Valoriza ordem e estrutura, e tende a encontrar no Cristo uma fé que combina com essa visão de mundo. Num tempo que esquece Roma a cada geração, carregar essa memória é ao mesmo tempo distinção e nostalgia — um olho no que foi, tentando não perder o que ainda sobrou.",
    },
    {
      id: "tradicional",
      label: "Mais Tradicional",
      description:
        "Há quem nunca precisou de Roma para saber quem é. O bretão tradicional pensa em linhagem, em terra ancestral, nos nomes que o pai disse e o avô cantou. Fala bretônico antes do latim, respeita os lugares sagrados onde a oferenda deve ser feita antes de qualquer decisão importante, e encontra autoridade não num documento mas numa história repetida tantas vezes que virou verdade. Não é ignorância — é raiz. É saber de onde se vem num tempo em que muita coisa mudou depressa demais.",
    },
  ],
};

// ── Nomes históricos ─────────────────────────────────────────────────────────
export const maleNames = [
  "Arthwr", "Caradoc", "Owain", "Geraint", "Peredur", "Maelgwn", "Vortigern",
  "Ambrosius", "Riothamus", "Vortimer", "Urien", "Gwalchmai", "Bedwyr", "Cai",
  "Taliesin", "Myrddin", "Aneirin", "Coel", "Cunomorus", "Aurelianus",
  "Vortemir", "Pascent", "Faustus", "Patricius", "Samson", "Cadoc", "Gildas",
  "Cunobelin", "Brennus", "Lleu", "Dyfrig", "Teilo", "Ninian", "Illutus",
];

export const femaleNames = [
  "Brigid", "Morgaine", "Guinevere", "Elaine", "Nimue", "Igraine", "Viviane",
  "Rhiannon", "Branwen", "Cerridwen", "Arianrhod", "Blodeuedd", "Modron",
  "Cordelia", "Boudicca", "Cartimandua", "Veleda", "Aurinia", "Senuna",
  "Coventina", "Sabrina", "Verbeia", "Arnemetia", "Cuda", "Ancasta",
  "Epona", "Lunaris", "Sequana",
];
