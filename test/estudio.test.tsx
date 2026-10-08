import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Estudio } from "@/components/Estudio";
import type { ClienteDaSonare, Criacao } from "@/lib/cliente";

const narracao = (criacaoId: string, extra: Partial<Criacao> = {}): Criacao => ({
  criacaoId,
  tipo: "narracao",
  texto: `Texto de ${criacaoId}`,
  voz: "pf_dora",
  status: "pronta",
  urlAudio: `http://s3.falso/${criacaoId}.mp3`,
  ...extra,
});

/** API falsa: páginas da Biblioteca e, para cada consulta, o próximo Status da lista. */
function clienteFalso({
  paginas = { "": { criacoes: [] } } as Record<string, { criacoes: Criacao[]; proximaPagina?: string }>,
  statusDaNova = [{ status: "pronta" }] as Partial<Criacao>[],
  recusa = undefined as string | undefined,
} = {}): ClienteDaSonare & { pedidos: unknown[] } {
  const pedidos: unknown[] = [];
  return {
    pedidos,
    async criar(pedido) {
      pedidos.push(pedido);
      return recusa ? { erro: recusa } : { criacaoId: "nova" };
    },
    async consultar(criacaoId) {
      const proximo = statusDaNova.length > 1 ? statusDaNova.shift()! : statusDaNova[0];
      return narracao(criacaoId, { texto: "Olá!", urlAudio: undefined, ...proximo, ...(proximo.status === "pronta" ? { urlAudio: "http://s3.falso/nova.mp3" } : {}) });
    },
    async listar(depoisDe) {
      return paginas[depoisDe ?? ""];
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

const biblioteca = () => screen.getByRole("region", { name: "Minhas Criações" });

describe("Estudio", () => {
  it("a Biblioteca mostra as Criações que já existem: prontas com player, falhas com aviso", async () => {
    abrir(
      clienteFalso({
        paginas: { "": { criacoes: [narracao("a"), narracao("b", { status: "falhou", urlAudio: undefined })] } },
      }),
    );

    const player = await within(biblioteca()).findByLabelText("Ouvir: Texto de a");
    expect(player.getAttribute("src")).toBe("http://s3.falso/a.mp3");
    expect(within(biblioteca()).getByText("Não deu certo. Tente novamente.")).toBeTruthy();
  });

  it("gerar uma Narração a coloca no topo da Biblioteca, pulsando, até virar player", async () => {
    const cliente = clienteFalso({ statusDaNova: [{ status: "na-fila" }, { status: "pronta" }] });

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

  it("um pedido recusado mostra a mensagem no cartão de Narração e não entra na Biblioteca", async () => {
    await gerarNarracao(clienteFalso({ recusa: "A Sonare está fora do ar. Tente de novo em instantes." }));

    expect((await screen.findByRole("alert")).textContent).toBe("A Sonare está fora do ar. Tente de novo em instantes.");
    expect(within(biblioteca()).queryByRole("status", { name: "Gerando a Narração" })).toBeNull();
  });

  it("o cartão de Imagem avisa que chega em breve", () => {
    abrir(clienteFalso());

    expect((screen.getByRole("button", { name: "Em breve" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("'Carregar mais' traz a próxima página da Biblioteca", async () => {
    abrir(
      clienteFalso({
        paginas: { "": { criacoes: [narracao("a")], proximaPagina: "a" }, a: { criacoes: [narracao("b")] } },
      }),
    );

    await userEvent.click(await screen.findByRole("button", { name: "Carregar mais" }));

    expect(await within(biblioteca()).findByLabelText("Ouvir: Texto de b")).toBeTruthy();
    expect(within(biblioteca()).getByLabelText("Ouvir: Texto de a")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Carregar mais" })).toBeNull();
  });
});
