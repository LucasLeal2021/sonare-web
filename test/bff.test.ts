// O BFF (as rotas /api/* do Next) só repassa para a sonare-api, que aqui é falsa.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/criacoes/route";

type Chamada = { url: string; corpo: unknown };

function apiFalsa(status: number, resposta: object) {
  const chamadas: Chamada[] = [];
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    chamadas.push({ url, corpo: JSON.parse(String(init?.body)) });
    return Response.json(resposta, { status });
  });
  return chamadas;
}

const pedir = (corpo: object) =>
  POST(new Request("http://localhost:3000/api/criacoes", { method: "POST", body: JSON.stringify(corpo) }));

beforeEach(() => vi.stubEnv("API_URL", "http://api.falsa:3333"));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("BFF: POST /api/criacoes", () => {
  it("repassa o pedido para a sonare-api e devolve a resposta dela", async () => {
    const chamadas = apiFalsa(201, { criacaoId: "c-1", status: "na-fila" });

    const resposta = await pedir({ tipo: "narracao", texto: "Olá!", voz: "pf_dora" });

    expect(resposta.status).toBe(201);
    expect(await resposta.json()).toEqual({ criacaoId: "c-1", status: "na-fila" });
    expect(chamadas).toEqual([
      { url: "http://api.falsa:3333/criacoes", corpo: { tipo: "narracao", texto: "Olá!", voz: "pf_dora" } },
    ]);
  });

  it("um pedido recusado pela API chega ao navegador com a mensagem em português", async () => {
    apiFalsa(400, { erro: "Escreva o Texto da Narração." });

    const resposta = await pedir({ tipo: "narracao", texto: "", voz: "pf_dora" });

    expect(resposta.status).toBe(400);
    expect(await resposta.json()).toEqual({ erro: "Escreva o Texto da Narração." });
  });

  it("se a sonare-api está fora do ar, responde 502 com uma mensagem em português", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("fetch failed"); // é o que o Node lança quando a conexão cai
    });

    const resposta = await pedir({ tipo: "narracao", texto: "Olá!", voz: "pf_dora" });

    expect(resposta.status).toBe(502);
    expect(await resposta.json()).toEqual({ erro: "A Sonare está fora do ar. Tente de novo em instantes." });
  });
});
