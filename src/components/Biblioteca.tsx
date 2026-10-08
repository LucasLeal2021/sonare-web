"use client";

import { useState } from "react";
import type { Criacao, TipoDeCriacao } from "@/lib/cliente";
import { nomeDaVoz } from "@/lib/vozes";
import { ImagemAmpliada } from "./ImagemAmpliada";

export type ItemDaBiblioteca = Criacao & { criadaAgora?: boolean };
type Imagem = Extract<Criacao, { tipo: "imagem" }>;

const FILTROS: { rotulo: string; tipo?: TipoDeCriacao }[] = [
  { rotulo: "tudo" },
  { rotulo: "vozes", tipo: "narracao" },
  { rotulo: "imagens", tipo: "imagem" },
];

/** "Minhas Criações": a grade com tudo que já foi criado, da mais nova para a mais antiga. */
export function Biblioteca({
  criacoes,
  filtro,
  aoFiltrar,
  temMais,
  aoCarregarMais,
  aoApagar,
}: {
  criacoes: ItemDaBiblioteca[];
  filtro?: TipoDeCriacao;
  aoFiltrar: (tipo?: TipoDeCriacao) => void;
  temMais: boolean;
  aoCarregarMais: () => void;
  /** Devolve a mensagem de erro, se a API recusou. */
  aoApagar: (id: string) => Promise<string | undefined>;
}) {
  const [ampliada, setAmpliada] = useState<Imagem>();

  return (
    <section aria-labelledby="titulo-biblioteca" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="titulo-biblioteca" className="font-titulo text-3xl">
          Minhas Criações
        </h2>
        <fieldset className="flex gap-1 rounded-full border border-grafite/10 p-1">
          <legend className="sr-only">Mostrar</legend>
          {FILTROS.map(({ rotulo, tipo }) => (
            <label
              key={rotulo}
              className={`cursor-pointer rounded-full px-4 py-1 text-sm transition-colors ${
                filtro === tipo ? "bg-nevoa text-grafite" : "text-grafite/50 hover:text-grafite"
              }`}
            >
              <input type="radio" name="filtro" checked={filtro === tipo} onChange={() => aoFiltrar(tipo)} className="sr-only" />
              {rotulo}
            </label>
          ))}
        </fieldset>
      </div>

      {criacoes.length === 0 ? (
        <p className="text-grafite/50">Nada por aqui ainda. Suas Criações aparecem aqui.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {criacoes.map((criacao) => (
            <li key={criacao.criacaoId}>
              <Cartao criacao={criacao} aoAmpliar={setAmpliada} aoApagar={aoApagar} />
            </li>
          ))}
        </ul>
      )}

      {temMais && (
        <button
          type="button"
          onClick={aoCarregarMais}
          className="self-center rounded-full border border-grafite/20 px-6 py-2 text-sm text-grafite/70 hover:border-grafite hover:text-grafite"
        >
          Carregar mais
        </button>
      )}

      {ampliada && <ImagemAmpliada imagem={ampliada} aoFechar={() => setAmpliada(undefined)} />}
    </section>
  );
}

function Cartao({
  criacao,
  aoAmpliar,
  aoApagar,
}: {
  criacao: ItemDaBiblioteca;
  aoAmpliar: (imagem: Imagem) => void;
  aoApagar: (id: string) => Promise<string | undefined>;
}) {
  const narracao = criacao.tipo === "narracao";
  // Título automático: a primeira linha do Texto (ou da Descrição)
  const titulo = (narracao ? criacao.texto : criacao.descricao).trim().split("\n")[0];

  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border border-grafite/10 p-4">
      <header className="flex items-center justify-between gap-3 text-xs text-grafite/50">
        <span>{narracao ? "♪ Narração" : "▢ Imagem"}</span>
        {narracao && <span className="rounded-full bg-nevoa/60 px-2 py-0.5">{nomeDaVoz(criacao.voz)}</span>}
      </header>

      {criacao.tipo === "imagem" && criacao.status === "pronta" && criacao.urlImagem ? (
        <button
          type="button"
          onClick={() => aoAmpliar(criacao)}
          aria-label={`Ampliar: ${criacao.descricao}`}
          className="cursor-zoom-in overflow-hidden rounded-xl"
        >
          {/* <img> e não next/image: o link é pré-assinado e temporário, de um bucket privado — não há o que otimizar */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={criacao.urlImagem} alt={criacao.descricao} className="aspect-square w-full object-cover transition-transform hover:scale-105" />
        </button>
      ) : (
        <p className="line-clamp-2 text-sm">{titulo}</p>
      )}

      <div className="mt-auto">
        {criacao.status === "na-fila" && (
          <div
            role="status"
            aria-label={narracao ? "Gerando a Narração" : "Gerando a Imagem"}
            className="flex items-center gap-3 text-sm text-grafite/50"
          >
            <span className="relative inline-block size-2 rounded-full bg-grafite">
              <span aria-hidden className="onda absolute inset-0 rounded-full border border-nevoa" />
            </span>
            gerando…
          </div>
        )}
        {criacao.tipo === "narracao" && criacao.status === "pronta" && criacao.urlAudio && (
          <audio controls autoPlay={criacao.criadaAgora} src={criacao.urlAudio} aria-label={`Ouvir: ${titulo}`} className="w-full" />
        )}
        {/* Recusas trazem um motivo escrito para o Artista; falhas do sistema, só o aviso genérico */}
        {criacao.status === "falhou" && (
          <p className="text-sm text-grafite/60">{criacao.recusada && criacao.motivo ? criacao.motivo : "Não deu certo. Tente novamente."}</p>
        )}
      </div>

      {criacao.status !== "na-fila" && <Acoes criacao={criacao} titulo={titulo} aoApagar={aoApagar} />}
    </article>
  );
}

/** Baixar e Apagar (com confirmação: apagar é definitivo, Q19). Só aparece depois que a Geração terminou. */
function Acoes({ criacao, titulo, aoApagar }: { criacao: ItemDaBiblioteca; titulo: string; aoApagar: (id: string) => Promise<string | undefined> }) {
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string>();

  async function apagarDeVez() {
    setErro(await aoApagar(criacao.criacaoId));
    setConfirmando(false);
  }

  if (confirmando) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-grafite/10 pt-3 text-xs">
        <span className="mr-auto text-grafite/70">Apagar esta Criação de vez?</span>
        <button type="button" onClick={() => setConfirmando(false)} className="rounded-full px-3 py-1 text-grafite/60 hover:text-grafite">
          Cancelar
        </button>
        <button type="button" onClick={apagarDeVez} className="rounded-full bg-grafite px-3 py-1 text-papel">
          Apagar de vez
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-4 border-t border-grafite/10 pt-3 text-xs text-grafite/50">
      {erro && (
        <span role="alert" className="mr-auto text-grafite/70">
          {erro}
        </span>
      )}
      {criacao.status === "pronta" && criacao.urlDownload && (
        <a href={criacao.urlDownload} className="underline-offset-4 hover:text-grafite hover:underline">
          Baixar
        </a>
      )}
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        aria-label={`Apagar: ${titulo}`}
        className="underline-offset-4 hover:text-grafite hover:underline"
      >
        Apagar
      </button>
    </div>
  );
}
