// Como a tela conversa com o BFF (as rotas /api/* do próprio Next).

export type Status = "na-fila" | "pronta" | "falhou";

export type Criacao = {
  criacaoId: string;
  tipo: "narracao";
  texto: string;
  voz: string;
  status: Status;
  urlAudio?: string;
  motivo?: string;
};

export type PedidoDeNarracao = { tipo: "narracao"; texto: string; voz: string };

export interface ClienteDaSonare {
  criar(pedido: PedidoDeNarracao): Promise<{ criacaoId: string } | { erro: string }>;
  consultar(criacaoId: string): Promise<Criacao>;
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
};
