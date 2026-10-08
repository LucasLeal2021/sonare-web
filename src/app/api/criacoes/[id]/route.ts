import { repassarParaApi } from "@/lib/sonareApi";

export async function GET(_requisicao: Request, ctx: RouteContext<"/api/criacoes/[id]">) {
  const { id } = await ctx.params;
  return repassarParaApi(`/criacoes/${encodeURIComponent(id)}`);
}
