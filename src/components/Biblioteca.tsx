import type { Criacao } from "@/lib/cliente";
import { nomeDaVoz } from "@/lib/vozes";

export type ItemDaBiblioteca = Criacao & { criadaAgora?: boolean };

/** "Minhas Criações": a grade com tudo que já foi criado, da mais nova para a mais antiga. */
export function Biblioteca({
  criacoes,
  temMais,
  aoCarregarMais,
}: {
  criacoes: ItemDaBiblioteca[];
  temMais: boolean;
  aoCarregarMais: () => void;
}) {
  return (
    <section aria-labelledby="titulo-biblioteca" className="flex flex-col gap-6">
      <h2 id="titulo-biblioteca" className="font-titulo text-3xl">
        Minhas Criações
      </h2>

      {criacoes.length === 0 ? (
        <p className="text-grafite/50">Nada por aqui ainda. Sua primeira Criação aparece aqui.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {criacoes.map((criacao) => (
            <li key={criacao.criacaoId}>
              <Cartao criacao={criacao} />
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
    </section>
  );
}

function Cartao({ criacao }: { criacao: ItemDaBiblioteca }) {
  const titulo = criacao.texto.trim().split("\n")[0]; // Título automático: a primeira linha do Texto

  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border border-grafite/10 p-4">
      <header className="flex items-center justify-between gap-3 text-xs text-grafite/50">
        <span>♪ Narração</span>
        <span className="rounded-full bg-nevoa/60 px-2 py-0.5">{nomeDaVoz(criacao.voz)}</span>
      </header>
      <p className="line-clamp-2 text-sm">{titulo}</p>

      <div className="mt-auto">
        {criacao.status === "na-fila" && (
          <div role="status" aria-label="Gerando a Narração" className="flex items-center gap-3 text-sm text-grafite/50">
            <span className="relative inline-block size-2 rounded-full bg-grafite">
              <span aria-hidden className="onda absolute inset-0 rounded-full border border-nevoa" />
            </span>
            gerando…
          </div>
        )}
        {criacao.status === "pronta" && criacao.urlAudio && (
          <audio controls autoPlay={criacao.criadaAgora} src={criacao.urlAudio} aria-label={`Ouvir: ${titulo}`} className="w-full" />
        )}
        {criacao.status === "falhou" && <p className="text-sm text-grafite/60">Não deu certo. Tente novamente.</p>}
      </div>
    </article>
  );
}
