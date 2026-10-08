import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Estudio } from "@/components/Estudio";
import type { ClienteDaSonare, Criacao, PaginaDaBiblioteca, TipoDeCriacao } from "@/lib/cliente";

const narracao = (criacaoId: string, extra: Partial<Criacao> = {}) =>
  ({
    criacaoId,
    tipo: "narracao",
    texto: `Texto de ${criacaoId}`,
    voz: "pf_dora",
    status: "pronta",
    urlAudio: `http://s3.falso/${criacaoId}.mp3`,
    ...extra,
  }) as Criacao;

const imagem = (criacaoId: string) =>
  ({
    criacaoId,
    tipo: "imagem",
    descricao: `Descrição de ${criacaoId}`,
    status: "pronta",
    prompt: `prompt of ${criacaoId}`,
    urlImagem: `http://s3.falso/${criacaoId}.jpg`,
    urlDownload: `http://s3.falso/${criacaoId}.jpg?baixar`,
  }) as Criacao;

/**
 * API falsa. `paginas` é indexado pelo filtro e pela página: "" (tudo, 1ª página), "a" (depois de "a"),
 * "tipo:imagem" (só Imagens). Cada consulta à Criação nova devolve o próximo item de `statusDaNova`.
 */
function clienteFalso({
  paginas = { "": { criacoes: [] } } as Record<string, PaginaDaBiblioteca>,
  statusDaNova = [{ status: "pronta" }] as Partial<Criacao>[],
  recusa = undefined as string | undefined,
} = {}): ClienteDaSonare & { pedidos: unknown[]; apagados: string[] } {
  const pedidos: Record<string, unknown>[] = [];
  const apagados: string[] = [];
  return {
    pedidos,
    apagados,
    async apagar(criacaoId) {
      apagados.push(criacaoId);
      return {};
    },
    async criar(pedido) {
      pedidos.push(pedido);
      return recusa ? { erro: recusa } : { criacaoId: "nova" };
    },
    async consultar(criacaoId) {
      const proximo = statusDaNova.length > 1 ? statusDaNova.shift()! : statusDaNova[0];
      return { criacaoId, status: "na-fila", ...pedidos.at(-1), ...proximo } as Criacao;
    },
    async listar(depoisDe?: string, tipo?: TipoDeCriacao) {
      return paginas[tipo ? `tipo:${tipo}` : (depoisDe ?? "")] ?? { criacoes: [] };
    },
  };
}

function abrir(cliente: ClienteDaSonare) {
  // Strict Mode como no `next dev`: o React monta, desmonta e monta de novo de propósito
  render(<Estudio cliente={cliente} intervaloMs={5} />, { reactStrictMode: true });
}

async function gerarNarracao(cliente: ClienteDaSonare) {
  abrir(cliente);
  await userEvent.type(screen.getByLabelText("Texto"), "Olá!");
  await userEvent.click(screen.getByRole("button", { name: "Gerar Narração" }));
}

async function gerarImagem(cliente: ClienteDaSonare) {
  abrir(cliente);
  await userEvent.type(screen.getByLabelText("Descrição"), "um farol");
  await userEvent.click(screen.getByRole("button", { name: "Gerar Imagem" }));
}

const biblioteca = () => screen.getByRole("region", { name: "Minhas Criações" });

describe("Estudio: Biblioteca", () => {
  it("mostra as Criações que já existem: Narrações com player, Imagens em miniatura, falhas com aviso", async () => {
    abrir(
      clienteFalso({
        paginas: { "": { criacoes: [narracao("a"), imagem("b"), narracao("c", { status: "falhou", urlAudio: undefined })] } },
      }),
    );

    const player = await within(biblioteca()).findByLabelText("Ouvir: Texto de a");
    expect(player.getAttribute("src")).toBe("http://s3.falso/a.mp3");
    expect(within(biblioteca()).getByRole("img", { name: "Descrição de b" }).getAttribute("src")).toBe("http://s3.falso/b.jpg");
    expect(within(biblioteca()).getByText("Não deu certo. Tente novamente.")).toBeTruthy();
  });

  it("'Carregar mais' traz a próxima página", async () => {
    abrir(clienteFalso({ paginas: { "": { criacoes: [narracao("a")], proximaPagina: "a" }, a: { criacoes: [narracao("b")] } } }));

    await userEvent.click(await screen.findByRole("button", { name: "Carregar mais" }));

    expect(await within(biblioteca()).findByLabelText("Ouvir: Texto de b")).toBeTruthy();
    expect(within(biblioteca()).getByLabelText("Ouvir: Texto de a")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Carregar mais" })).toBeNull();
  });

  it("o filtro 'imagens' mostra só as Imagens", async () => {
    abrir(
      clienteFalso({ paginas: { "": { criacoes: [narracao("a"), imagem("b")] }, "tipo:imagem": { criacoes: [imagem("b")] } } }),
    );
    await within(biblioteca()).findByLabelText("Ouvir: Texto de a");

    await userEvent.click(within(biblioteca()).getByRole("radio", { name: "imagens" }));

    expect(await within(biblioteca()).findByRole("img", { name: "Descrição de b" })).toBeTruthy();
    expect(within(biblioteca()).queryByLabelText("Ouvir: Texto de a")).toBeNull();
  });
});

describe("Estudio: recusas", () => {
  it("uma Criação recusada pelo provedor mostra o motivo, e não o aviso genérico", async () => {
    const motivo = "A Cloudflare recusou esta Descrição pelo filtro de conteúdo. Tente descrever de outro jeito.";
    abrir(
      clienteFalso({
        paginas: { "": { criacoes: [{ ...imagem("b"), status: "falhou", recusada: true, motivo, urlImagem: undefined } as Criacao] } },
      }),
    );

    expect(await within(biblioteca()).findByText(motivo)).toBeTruthy();
    expect(within(biblioteca()).queryByText("Não deu certo. Tente novamente.")).toBeNull();
  });
});

describe("Estudio: ampliar e baixar", () => {
  it("clicar na miniatura abre a Imagem ampliada, com o Prompt e um link para baixar; Fechar volta à Biblioteca", async () => {
    abrir(clienteFalso({ paginas: { "": { criacoes: [imagem("b")] } } }));

    await userEvent.click(await screen.findByRole("button", { name: "Ampliar: Descrição de b" }));

    const ampliada = screen.getByRole("dialog", { name: "Descrição de b" });
    expect(within(ampliada).getByRole("img", { name: "Descrição de b" }).getAttribute("src")).toBe("http://s3.falso/b.jpg");
    expect(within(ampliada).getByText("prompt of b")).toBeTruthy();
    expect(within(ampliada).getByRole("link", { name: "Baixar" }).getAttribute("href")).toBe("http://s3.falso/b.jpg?baixar");

    await userEvent.click(within(ampliada).getByRole("button", { name: "Fechar" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("a tecla Esc também fecha a Imagem ampliada", async () => {
    abrir(clienteFalso({ paginas: { "": { criacoes: [imagem("b")] } } }));
    await userEvent.click(await screen.findByRole("button", { name: "Ampliar: Descrição de b" }));

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("uma Narração pronta tem um link para baixar o Áudio", async () => {
    abrir(clienteFalso({ paginas: { "": { criacoes: [narracao("a", { urlDownload: "http://s3.falso/a.mp3?baixar" } as Partial<Criacao>)] } } }));

    const link = await within(biblioteca()).findByRole("link", { name: "Baixar" });
    expect(link.getAttribute("href")).toBe("http://s3.falso/a.mp3?baixar");
  });
});

describe("Estudio: apagar", () => {
  it("apagar pede confirmação e, confirmado, tira a Criação da Biblioteca", async () => {
    const cliente = clienteFalso({ paginas: { "": { criacoes: [narracao("a"), imagem("b")] } } });
    abrir(cliente);

    await userEvent.click(await screen.findByRole("button", { name: "Apagar: Descrição de b" }));
    await userEvent.click(screen.getByRole("button", { name: "Apagar de vez" }));

    expect(cliente.apagados).toEqual(["b"]);
    expect(within(biblioteca()).queryByRole("button", { name: "Ampliar: Descrição de b" })).toBeNull();
    expect(within(biblioteca()).getByLabelText("Ouvir: Texto de a")).toBeTruthy();
  });

  it("cancelar a confirmação mantém a Criação", async () => {
    const cliente = clienteFalso({ paginas: { "": { criacoes: [narracao("a")] } } });
    abrir(cliente);

    await userEvent.click(await screen.findByRole("button", { name: "Apagar: Texto de a" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(cliente.apagados).toEqual([]);
    expect(within(biblioteca()).getByLabelText("Ouvir: Texto de a")).toBeTruthy();
  });

  it("uma Criação ainda gerando não pode ser apagada", async () => {
    abrir(clienteFalso({ paginas: { "": { criacoes: [narracao("a", { status: "na-fila", urlAudio: undefined })] } } }));

    await within(biblioteca()).findByRole("status", { name: "Gerando a Narração" });

    expect(screen.queryByRole("button", { name: "Apagar: Texto de a" })).toBeNull();
  });
});

describe("Estudio: Narração", () => {
  it("gerar uma Narração a coloca no topo da Biblioteca, pulsando, até virar player", async () => {
    const cliente = clienteFalso({ statusDaNova: [{ status: "na-fila" }, { status: "pronta", urlAudio: "http://s3.falso/nova.mp3" }] });

    await gerarNarracao(cliente);

    expect(await within(biblioteca()).findByRole("status", { name: "Gerando a Narração" })).toBeTruthy();
    const player = await within(biblioteca()).findByLabelText("Ouvir: Olá!");
    expect(player.getAttribute("src")).toBe("http://s3.falso/nova.mp3");
    expect(within(biblioteca()).queryByRole("status", { name: "Gerando a Narração" })).toBeNull();
    expect(cliente.pedidos).toEqual([{ tipo: "narracao", texto: "Olá!", voz: "pf_dora" }]);
  });

  it("uma Narração que falha avisa que não deu certo", async () => {
    await gerarNarracao(clienteFalso({ statusDaNova: [{ status: "falhou", motivo: "Kokoro falhou" }] }));

    expect(await within(biblioteca()).findByText("Não deu certo. Tente novamente.")).toBeTruthy();
  });

  it("um pedido recusado mostra a mensagem no cartão e não entra na Biblioteca", async () => {
    await gerarNarracao(clienteFalso({ recusa: "A Sonare está fora do ar. Tente de novo em instantes." }));

    expect((await screen.findByRole("alert")).textContent).toBe("A Sonare está fora do ar. Tente de novo em instantes.");
    expect(within(biblioteca()).queryByRole("status", { name: "Gerando a Narração" })).toBeNull();
  });
});

describe("Estudio: Imagem", () => {
  it("gerar uma Imagem a coloca no topo da Biblioteca, pulsando, até virar miniatura", async () => {
    const cliente = clienteFalso({ statusDaNova: [{ status: "na-fila" }, { status: "pronta", urlImagem: "http://s3.falso/nova.jpg" }] });

    await gerarImagem(cliente);

    expect(await within(biblioteca()).findByRole("status", { name: "Gerando a Imagem" })).toBeTruthy();
    const miniatura = await within(biblioteca()).findByRole("img", { name: "um farol" });
    expect(miniatura.getAttribute("src")).toBe("http://s3.falso/nova.jpg");
    expect(cliente.pedidos).toEqual([{ tipo: "imagem", descricao: "um farol" }]);
  });
});
