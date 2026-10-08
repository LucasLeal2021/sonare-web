import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Desmonta a tela depois de cada teste (sem `globals: true`, o Testing Library não faz isso sozinho)
afterEach(cleanup);
