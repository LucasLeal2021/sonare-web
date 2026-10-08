"use client";

import { useEffect, useState } from "react";
import { clienteHttp, type ClienteDaSonare, type TipoDeCriacao } from "@/lib/cliente";
import { Biblioteca, type ItemDaBiblioteca } from "./Biblioteca";
import { CartaoImagem } from "./CartaoImagem";
import { CartaoNarracao } from "./CartaoNarracao";
import { Logo } from "./Logo";

/** O estúdio do Artista: criar Narrações e Imagens, e a Biblioteca com tudo que já criou. */
export function Estudio({ cliente = clienteHttp, intervaloMs = 3000 }: { cliente?: ClienteDaSonare; intervaloMs?: number }) {
  const [criacoes, setCriacoes] = useState<ItemDaBiblioteca[]>([]);
  const [proximaPagina, setProximaPagina] = useState<string>();
  const [filtro, setFiltro] = useState<TipoDeCriacao>();

  // Primeira página da Biblioteca (de novo a cada troca de filtro). O `ativo` ignora a resposta
  // se a tela já foi desmontada (o Strict Mode monta duas vezes; sem isso, a lista viria duplicada).
  useEffect(() => {
    let ativo = true;
    cliente.listar(undefined, filtro).then((pagina) => {
      if (!ativo) return;
      setCriacoes(pagina.criacoes);
      setProximaPagina(pagina.proximaPagina);
    });
    return () => {
      ativo = false;
    };
  }, [cliente, filtro]);

  // Polling (Q5): enquanto houver Criação na fila, pergunta o Status de cada uma a cada intervaloMs
  useEffect(() => {
    const pendentes = criacoes.filter((c) => c.status === "na-fila");
    if (pendentes.length === 0) return;
    let ativo = true;
    const relogio = setTimeout(async () => {
      const atualizadas = await Promise.all(pendentes.map((c) => cliente.consultar(c.criacaoId)));
      if (!ativo) return;
      setCriacoes((atuais) =>
        atuais.map((c) => {
          const nova = atualizadas.find((a) => a.criacaoId === c.criacaoId && a.status); // ignora respostas de erro
          return nova ? ({ ...c, ...nova } as ItemDaBiblioteca) : c;
        }),
      );
    }, intervaloMs);
    return () => {
      ativo = false;
      clearTimeout(relogio);
    };
  }, [criacoes, cliente, intervaloMs]);

  async function carregarMais() {
    const pagina = await cliente.listar(proximaPagina, filtro);
    setCriacoes((atuais) => [...atuais, ...pagina.criacoes]);
    setProximaPagina(pagina.proximaPagina);
  }

  // A Criação nova entra no topo, pulsando, se o filtro atual a mostra
  function aoCriar(nova: ItemDaBiblioteca) {
    if (filtro && filtro !== nova.tipo) return;
    setCriacoes((atuais) => [nova, ...atuais]);
  }

  // Apagar de vez: só tira da Biblioteca depois que a API confirmou
  async function apagar(criacaoId: string) {
    const { erro } = await cliente.apagar(criacaoId);
    if (!erro) setCriacoes((atuais) => atuais.filter((c) => c.criacaoId !== criacaoId));
    return erro;
  }

  const algumaGerando = criacoes.some((c) => c.status === "na-fila");

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-14">
      <header className="flex flex-col items-center gap-3">
        <Logo pulsando={algumaGerando} />
        <p className="font-titulo text-lg italic text-grafite/60">do silêncio nasce a criação</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <CartaoNarracao
          cliente={cliente}
          aoCriar={(nova) => aoCriar({ ...nova, tipo: "narracao", status: "na-fila", criadaAgora: true })}
        />
        <CartaoImagem cliente={cliente} aoCriar={(nova) => aoCriar({ ...nova, tipo: "imagem", status: "na-fila", criadaAgora: true })} />
      </div>

      <Biblioteca
        criacoes={criacoes}
        filtro={filtro}
        aoFiltrar={setFiltro}
        temMais={Boolean(proximaPagina)}
        aoCarregarMais={carregarMais}
        aoApagar={apagar}
      />
    </main>
  );
}
