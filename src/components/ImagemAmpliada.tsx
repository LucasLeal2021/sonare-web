"use client";

import { useEffect } from "react";
import type { Criacao } from "@/lib/cliente";

type Imagem = Extract<Criacao, { tipo: "imagem" }>;

/** A Imagem em tamanho grande, com a Descrição, o Prompt usado e o botão de baixar. Esc ou clicar fora fecha. */
export function ImagemAmpliada({ imagem, aoFechar }: { imagem: Imagem; aoFechar: () => void }) {
  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => evento.key === "Escape" && aoFechar();
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aoFechar]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-grafite/80 p-4" onClick={aoFechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={imagem.descricao}
        onClick={(e) => e.stopPropagation()} // clicar na própria Imagem não fecha
        className="flex max-h-full w-full max-w-3xl flex-col gap-4 rounded-3xl bg-papel p-4 sm:p-6"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- link pré-assinado e temporário, nada a otimizar */}
        <img src={imagem.urlImagem} alt={imagem.descricao} className="max-h-[70vh] w-full rounded-2xl object-contain" />

        <div className="flex flex-col gap-1">
          <p className="font-titulo text-xl">{imagem.descricao}</p>
          {imagem.prompt && (
            <p className="text-xs text-grafite/50">
              Prompt usado: <span>{imagem.prompt}</span>
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={aoFechar}
            className="rounded-full border border-grafite/20 px-6 py-2 text-sm text-grafite/70 hover:border-grafite hover:text-grafite"
          >
            Fechar
          </button>
          {imagem.urlDownload && (
            <a href={imagem.urlDownload} className="rounded-full bg-grafite px-6 py-2 text-sm text-papel">
              Baixar
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
