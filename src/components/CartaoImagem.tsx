"use client";

import { useState } from "react";
import type { ClienteDaSonare } from "@/lib/cliente";

const DESCRICAO_MAXIMA = 500;

/** Cria uma Imagem a partir de uma Descrição. Quando a API aceita, avisa a Biblioteca e limpa o campo. */
export function CartaoImagem({
  cliente,
  aoCriar,
}: {
  cliente: ClienteDaSonare;
  aoCriar: (nova: { criacaoId: string; descricao: string }) => void;
}) {
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string>();

  async function gerar(evento: React.FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setErro(undefined);
    const resposta = await cliente.criar({ tipo: "imagem", descricao });
    setEnviando(false);
    if ("erro" in resposta) return setErro(resposta.erro);
    aoCriar({ criacaoId: resposta.criacaoId, descricao });
    setDescricao("");
  }

  return (
    <form onSubmit={gerar} className="flex flex-col gap-5 rounded-3xl border border-grafite/10 p-6">
      <h2 className="font-titulo text-2xl">Imagem</h2>

      <label htmlFor="descricao" className="sr-only">
        Descrição
      </label>
      <textarea
        id="descricao"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        maxLength={DESCRICAO_MAXIMA}
        rows={4}
        placeholder="Descreva a Imagem que você imagina…"
        className="w-full resize-none border-b border-grafite/20 bg-transparent py-2 leading-relaxed placeholder:text-grafite/35 focus:border-grafite focus:outline-none"
      />

      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-grafite/40">1024 × 1024</span>
        <span className="text-xs tabular-nums text-grafite/40">
          {descricao.length}/{DESCRICAO_MAXIMA}
        </span>
      </div>

      {erro && (
        <p role="alert" className="text-sm text-grafite/70">
          {erro}
        </p>
      )}

      <button
        type="submit"
        aria-label="Gerar Imagem"
        disabled={enviando}
        className="self-end rounded-full bg-grafite px-8 py-2.5 text-sm tracking-wide text-papel transition-opacity disabled:opacity-40"
      >
        Gerar
      </button>
    </form>
  );
}
