// As Vozes da Narração (ADR 0011). dora é a padrão.
export const VOZES = [
  { id: "pf_dora", nome: "dora" },
  { id: "pm_alex", nome: "alex" },
  { id: "pm_santa", nome: "santa" },
];

export const nomeDaVoz = (id: string) => VOZES.find((v) => v.id === id)?.nome ?? id;
