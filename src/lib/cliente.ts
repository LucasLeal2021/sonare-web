// Como a tela conversa com o BFF (as rotas /api/* do próprio Next).

export type Status = "na-fila" | "pronta" | "falhou";
export type TipoDeCriacao = "narracao" | "imagem";

/**
 * `urlDownload`: link que faz o navegador SALVAR o arquivo (em vez de abri-lo).
 * `recusada`: o provedor recusou de vez (ex.: filtro de conteúdo) e o `motivo` é para o Artista ler.
 */
type Comum = { criacaoId: string; status: Status; motivo?: string; recusada?: boolean; urlDownload?: string };

export type Criacao =
  | (Comum & { tipo: "narracao"; texto: string; voz: string; urlAudio?: string })
  | (Comum & { tipo: "imagem"; descricao: string; urlImagem?: string; prompt?: string });

export type Pedido = { tipo: "narracao"; texto: string; voz: string } | { tipo: "imagem"; descricao: string };

export type PaginaDaBiblioteca = { criacoes: Criacao[]; proximaPagina?: string };

export interface ClienteDaSonare {
  criar(pedido: Pedido): Promise<{ criacaoId: string } | { erro: string }>;
  consultar(criacaoId: string): Promise<Criacao>;
  listar(depoisDe?: string, tipo?: TipoDeCriacao): Promise<PaginaDaBiblioteca>;
  /** Apaga de vez. Devolve `erro` se a API recusou (ex.: Criação ainda na fila). */
  apagar(criacaoId: string): Promise<{ erro?: string }>;
}

export const clienteHttp: ClienteDaSonare = {
  async criar(pedido) {
    const resposta = await fetch("/api/criacoes", { method: "POST", body: JSON.stringify(pedido) });
    return resposta.json();
  },
  async consultar(criacaoId) {
    const resposta = await fetch(`/api/criacoes/${encodeURIComponent(criacaoId)}`, { cache: "no-store" });
    return resposta.json();
  },
  async listar(depoisDe, tipo) {
    const consulta = new URLSearchParams();
    if (depoisDe) consulta.set("depoisDe", depoisDe);
    if (tipo) consulta.set("tipo", tipo);
    const resposta = await fetch(`/api/criacoes?${consulta}`, { cache: "no-store" });
    const pagina = await resposta.json();
    return { criacoes: pagina.criacoes ?? [], proximaPagina: pagina.proximaPagina };
  },
  async apagar(criacaoId) {
    const resposta = await fetch(`/api/criacoes/${encodeURIComponent(criacaoId)}`, { method: "DELETE" });
    if (resposta.status === 204) return {};
    // Qualquer outra resposta é recusa: nunca tratar como "apagado" (a Criação continuaria no banco)
    const corpo = await resposta.json().catch(() => ({}));
    return { erro: corpo.erro ?? "Não foi possível apagar agora. Tente de novo." };
  },
};
