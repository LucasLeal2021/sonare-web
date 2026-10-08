import { repassarParaApi } from "@/lib/sonareApi";

export async function POST(requisicao: Request) {
  return repassarParaApi("/criacoes", { method: "POST", body: await requisicao.text() });
}
