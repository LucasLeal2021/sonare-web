// `npm run dev`: liga o Next e, quando a página responder, abre o navegador sozinho.
// Para não abrir (ex.: já tem uma aba aberta): SEM_NAVEGADOR=1 npm run dev
import { spawn } from "node:child_process";

const porta = process.env.PORT ?? "3000";
const url = `http://localhost:${porta}`;

// Roda o Next pelo próprio Node, sem shell: funciona igual no Windows, Linux e macOS,
// e o Ctrl+C no terminal chega direto nele.
const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--port", porta], { stdio: "inherit" });
next.on("exit", (codigo) => process.exit(codigo ?? 0));

if (!process.env.SEM_NAVEGADOR) void abrirQuandoResponder();

// Uma pergunta por vez: só pergunta de novo depois que a anterior terminou. (Com setInterval,
// o Next segurava a 1ª pergunta enquanto compilava, a 2ª saía junto, e abriam DUAS abas.)
async function abrirQuandoResponder() {
  const limite = Date.now() + 60_000; // desiste depois de 1 minuto
  while (Date.now() < limite) {
    try {
      if ((await fetch(url)).ok) return abrirNavegador(url);
    } catch {
      // ainda não subiu
    }
    await new Promise((r) => setTimeout(r, 1_000));
  }
}

function abrirNavegador(endereco) {
  const [programa, argumentos] =
    process.platform === "win32"
      ? ["cmd", ["/c", "start", "", endereco]]
      : process.platform === "darwin"
        ? ["open", [endereco]]
        : ["xdg-open", [endereco]];
  spawn(programa, argumentos, { stdio: "ignore", detached: true }).unref();
}
