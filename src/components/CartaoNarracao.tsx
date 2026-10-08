"use client";

import { useState } from "react";
import type { ClienteDaSonare } from "@/lib/cliente";
import { VOZES } from "@/lib/vozes";

const TEXTO_MAXIMO = 1000;

/** Cria uma Narração: Texto + Voz. Quando a API aceita, avisa a Biblioteca e limpa o campo. */
export function CartaoNarracao({
  cliente,
  aoCriar,
}: {
  cliente: ClienteDaSonare;
  aoCriar: (nova: { criacaoId: string; texto: string; voz: string }) => void;
}) {
  const [texto, setTexto] = useState("");
  const [voz, setVoz] = useState(VOZES[0].id);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string>();

  async function gerar(evento: React.FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setErro(undefined);
    const resposta = await cliente.criar({ tipo: "narracao", texto, voz });
    setEnviando(false);
    if ("erro" in resposta) return setErro(resposta.erro);
    aoCriar({ criacaoId: resposta.criacaoId, texto, voz });
    setTexto("");
  }

  return (
    <form onSubmit={gerar} className="flex flex-col gap-5 rounded-3xl border border-grafite/10 p-6">
      <h2 className="font-titulo text-2xl">Narração</h2>

      <label htmlFor="texto" className="sr-only">
        Texto
      </label>
      <textarea
        id="texto"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        maxLength={TEXTO_MAXIMO}
        rows={4}
        placeholder="Escreva o Texto que a Voz vai narrar…"
        className="w-full resize-none border-b border-grafite/20 bg-transparent py-2 leading-relaxed placeholder:text-grafite/35 focus:border-grafite focus:outline-none"
      />

      <div className="flex items-center justify-between gap-4">
        <fieldset className="flex gap-2">
          <legend className="sr-only">Voz</legend>
          {VOZES.map(({ id, nome }) => (
            <label
              key={id}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-sm transition-colors ${
                voz === id ? "bg-nevoa text-grafite" : "text-grafite/50 hover:text-grafite"
              }`}
            >
              <input type="radio" name="voz" value={id} checked={voz === id} onChange={() => setVoz(id)} className="sr-only" />
              {nome}
            </label>
          ))}
        </fieldset>
        <span className="text-xs tabular-nums text-grafite/40">
          {texto.length}/{TEXTO_MAXIMO}
        </span>
      </div>

      {erro && (
        <p role="alert" className="text-sm text-grafite/70">
          {erro}
        </p>
      )}

      <button
        type="submit"
        aria-label="Gerar Narração"
        disabled={enviando}
        className="self-end rounded-full bg-grafite px-8 py-2.5 text-sm tracking-wide text-papel transition-opacity disabled:opacity-40"
      >
        Gerar
      </button>
    </form>
  );
}
