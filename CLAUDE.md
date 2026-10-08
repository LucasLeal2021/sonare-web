@AGENTS.md

# sonare-web (Next.js)

**Antes de qualquer tarefa, leia `../sonare-api/CLAUDE.md`**: modo de trabalho com o Lucas, regras, pegadinhas e onde ficam o glossário, o roteiro e as ADRs.

## Este repositório

- Roda direto no Windows (`npm run dev` sobe o Next e abre o navegador), não em container.
- O navegador só fala com o BFF (`src/app/api/*`), que repassa para a `sonare-api` em `API_URL` (variável só do servidor, em `.env.local`). Erros chegam sempre como JSON com mensagem em PT-BR.
- A tela é o `src/components/Estudio.tsx` com o cliente da API injetado; os testes usam um cliente falso.
- Testes da tela: Testing Library encontrando elementos por papel e rótulo acessíveis, renderizando em **Strict Mode** (como o `next dev`).
- Visual: só existem as cores `papel`, `grafite` e `nevoa` (o `globals.css` apaga a paleta padrão do Tailwind); fontes `font-titulo`, `font-ui` e `font-logo`.
- `npm run typecheck` gera os tipos de rota do Next antes do `tsc`.
