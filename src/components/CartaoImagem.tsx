/** Cria uma Imagem a partir de uma Descrição. Ainda não ligado: a geração de Imagens vem na próxima etapa. */
export function CartaoImagem() {
  return (
    <form className="flex flex-col gap-5 rounded-3xl border border-grafite/10 p-6" aria-describedby="imagem-em-breve">
      <h2 className="font-titulo text-2xl">Imagem</h2>

      <label htmlFor="descricao" className="sr-only">
        Descrição
      </label>
      <textarea
        id="descricao"
        disabled
        rows={4}
        placeholder="Descreva a Imagem que você imagina…"
        className="w-full resize-none border-b border-grafite/20 bg-transparent py-2 leading-relaxed placeholder:text-grafite/35 disabled:cursor-not-allowed"
      />

      <p id="imagem-em-breve" className="text-sm text-grafite/50">
        A geração de Imagens chega em breve.
      </p>

      <button
        type="button"
        disabled
        className="self-end rounded-full bg-grafite px-8 py-2.5 text-sm tracking-wide text-papel opacity-30"
      >
        Em breve
      </button>
    </form>
  );
}
