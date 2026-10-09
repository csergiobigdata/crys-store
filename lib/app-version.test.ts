import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { APP_VERSION } from "./app-version";

describe("versão fixa do aplicativo", () => {
  it("é 1.2.0 (não muda a cada deploy)", () => {
    expect(APP_VERSION).toBe("1.2.0");
  });

  it("o package.json acompanha a versão exibida em 'Sobre'", () => {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
      version: string;
    };
    expect(pkg.version).toBe(APP_VERSION);
  });
});
