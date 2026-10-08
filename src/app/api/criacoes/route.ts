import { repassarParaApi } from "@/lib/sonareApi";

// A Biblioteca: repassa a página pedida (?depoisDe=...) para a sonare-api
export async function GET(requisicao: Request) {
  return repassarParaApi(`/criacoes${new URL(requisicao.url).search}`);
}

export async function POST(requisicao: Request) {
  return repassarParaApi("/criacoes", { method: "POST", body: await requisicao.text() });
}
