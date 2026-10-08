# sonare-web

A tela da Sonare (Next.js 16 + Tailwind): os cartões de Narração e Imagem e a Biblioteca "Minhas Criações".

A rotina para subir tudo, o setup inicial e a documentação do projeto estão no [`sonare-api`](https://github.com/LucasLeal2021/sonare-api) (`README.md` e `docs/`).

```bash
cp .env.example .env.local   # na primeira vez: aponta o BFF para a API (localhost:3333)
npm run dev                  # sobe em localhost:3000 e abre o navegador (SEM_NAVEGADOR=1 para não abrir)
npm test                     # testes da tela e do BFF
npm run typecheck
```
