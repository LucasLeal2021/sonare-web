// Só roda no servidor do Next (BFF): o navegador nunca vê o endereço da sonare-api.
// API_URL não tem o prefixo NEXT_PUBLIC_, então não vai para o JavaScript do navegador.

const FORA_DO_AR = { erro: "A Sonare está fora do ar. Tente de novo em instantes." };

/** Repassa a chamada para a sonare-api e devolve a resposta dela como veio (status + JSON). */
export async function repassarParaApi(caminho: string, init?: RequestInit) {
  try {
    const resposta = await fetch(`${process.env.API_URL}${caminho}`, {
      ...init,
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (resposta.status === 204) return new Response(null, { status: 204 }); // sucesso sem corpo (ex.: apagar)
    return Response.json(await resposta.json(), { status: resposta.status });
  } catch (erro) {
    // API desligada, caída no meio da resposta ou respondendo algo que não é JSON:
    // o navegador recebe sempre um JSON com mensagem, nunca um 500 vazio.
    console.error("sonare-api indisponível:", (erro as Error).message);
    return Response.json(FORA_DO_AR, { status: 502 });
  }
}
