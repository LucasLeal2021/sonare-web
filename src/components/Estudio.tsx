"use client";

import { useEffect, useRef, useState } from "react";
import { clienteHttp, type ClienteDaSonare } from "@/lib/cliente";
import { Logo } from "./Logo";

const VOZES = [
  { id: "pf_dora", nome: "dora" },
  { id: "pm_alex", nome: "alex" },
  { id: "pm_santa", nome: "santa" },
];
const TEXTO_MAXIMO = 1000;

type Fase =
  | { tipo: "ociosa" }
  | { tipo: "gerando" }
  | { tipo: "pronta"; urlAudio: string }
  | { tipo: "falhou" }
  | { tipo: "recusada"; erro: string };

/** A tela em branco onde o Artista cria: Texto, Voz e "Gerar". */
export function Estudio({ cliente = clienteHttp, intervaloMs = 3000 }: { cliente?: ClienteDaSonare; intervaloMs?: number }) {
  const [texto, setTexto] = useState("");
  const [voz, setVoz] = useState(VOZES[0].id);
  const [fase, setFase] = useState<Fase>({ tipo: "ociosa" });
  // Para o polling se a tela sair. Marca "ativa" ao MONTAR (e não só no valor inicial): o Strict
  // Mode desmonta e remonta de propósito, e sem isso o polling nunca começava.
  const ativa = useRef(false);
  useEffect(() => {
    ativa.current = true;
    return () => {
      ativa.current = false;
    };
  }, []);

  async function gerar(evento: React.FormEvent) {
    evento.preventDefault();
    setFase({ tipo: "gerando" });

    const pedido = await cliente.criar({ tipo: "narracao", texto, voz });
    if ("erro" in pedido) return setFase({ tipo: "recusada", erro: pedido.erro });

    // Polling (Q5): pergunta a cada intervaloMs até a Criação ficar pronta ou falhar
    while (ativa.current) {
      await new Promise((r) => setTimeout(r, intervaloMs));
      const criacao = await cliente.consultar(pedido.criacaoId);
      if (criacao.status === "pronta" && criacao.urlAudio) return setFase({ tipo: "pronta", urlAudio: criacao.urlAudio });
      if (criacao.status === "falhou") return setFase({ tipo: "falhou" });
    }
  }

  const gerando = fase.tipo === "gerando";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center gap-10 px-4 py-16">
      <header className="flex flex-col items-center gap-3">
        {gerando ? (
          <div role="status" aria-label="Gerando a Narração">
            <Logo pulsando />
          </div>
        ) : (
          <Logo />
        )}
        <p className="font-titulo text-lg italic text-grafite/60">do silêncio nasce a criação</p>
      </header>

      <form onSubmit={gerar} className="flex w-full flex-col gap-6">
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
          className="w-full resize-none border-b border-grafite/20 bg-transparent py-3 text-lg leading-relaxed placeholder:text-grafite/35 focus:border-grafite focus:outline-none"
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

        <button
          type="submit"
          disabled={gerando}
          className="self-center rounded-full bg-grafite px-10 py-3 text-sm tracking-wide text-papel transition-opacity disabled:opacity-40"
        >
          Gerar
        </button>
      </form>

      <section className="min-h-16 w-full">
        {fase.tipo === "pronta" && (
          <audio controls autoPlay src={fase.urlAudio} aria-label="Ouvir a Narração" className="w-full" />
        )}
        {fase.tipo === "falhou" && <p className="text-center text-grafite/70">Não deu certo. Tente novamente.</p>}
        {fase.tipo === "recusada" && (
          <p role="alert" className="text-center text-grafite/70">
            {fase.erro}
          </p>
        )}
      </section>
    </main>
  );
}
