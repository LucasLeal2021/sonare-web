import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Estudio } from "@/components/Estudio";
import type { ClienteDaSonare, Criacao } from "@/lib/cliente";

/** API falsa: aceita o pedido e responde cada consulta com o próximo Status da lista. */
function clienteFalso(respostas: Partial<Criacao>[]): ClienteDaSonare & { pedidos: unknown[] } {
  const pedidos: unknown[] = [];
  return {
    pedidos,
    async criar(pedido) {
      pedidos.push(pedido);
      return { criacaoId: "c-1" };
    },
    async consultar(criacaoId) {
      const proxima = respostas.length > 1 ? respostas.shift()! : respostas[0];
      return { criacaoId, tipo: "narracao", texto: "Olá!", voz: "pf_dora", status: "na-fila", ...proxima };
    },
  };
}

async function gerarNarracao(cliente: ClienteDaSonare) {
  // Strict Mode como no `next dev`: o React monta, desmonta e monta de novo de propósito
  render(<Estudio cliente={cliente} intervaloMs={5} />, { reactStrictMode: true });
  await userEvent.type(screen.getByLabelText("Texto"), "Olá!");
  await userEvent.click(screen.getByRole("button", { name: "Gerar" }));
}

describe("Estudio", () => {
  it("escrever o Texto e clicar em Gerar faz o ponto pulsar enquanto a Narração está na fila", async () => {
    const cliente = clienteFalso([{ status: "na-fila" }]);

    await gerarNarracao(cliente);

    expect(await screen.findByRole("status", { name: "Gerando a Narração" })).toBeTruthy();
    expect(cliente.pedidos).toEqual([{ tipo: "narracao", texto: "Olá!", voz: "pf_dora" }]);
  });

  it("quando a Narração fica pronta, o ponto para e aparece o player com o Áudio", async () => {
    const cliente = clienteFalso([{ status: "na-fila" }, { status: "pronta", urlAudio: "http://s3.falso/c-1.mp3" }]);

    await gerarNarracao(cliente);

    const player = await screen.findByLabelText("Ouvir a Narração");
    expect(player.getAttribute("src")).toBe("http://s3.falso/c-1.mp3");
    expect(screen.queryByRole("status", { name: "Gerando a Narração" })).toBeNull();
  });

  it("quando a Narração falha, avisa que não deu certo", async () => {
    const cliente = clienteFalso([{ status: "falhou", motivo: "Kokoro falhou" }]);

    await gerarNarracao(cliente);

    expect(await screen.findByText("Não deu certo. Tente novamente.")).toBeTruthy();
  });

  it("se o pedido é recusado (ex.: a Sonare fora do ar), mostra a mensagem e o ponto não fica pulsando", async () => {
    const cliente: ClienteDaSonare = {
      criar: async () => ({ erro: "A Sonare está fora do ar. Tente de novo em instantes." }),
      consultar: async () => {
        throw new Error("não deveria consultar");
      },
    };

    await gerarNarracao(cliente);

    expect((await screen.findByRole("alert")).textContent).toBe("A Sonare está fora do ar. Tente de novo em instantes.");
    expect(screen.queryByRole("status", { name: "Gerando a Narração" })).toBeNull();
  });
});
