// Stub usado só em testes (ver vitest.config.mts): o pacote real
// "server-only" lança erro fora do pipeline de build do Next.js, o que
// quebraria qualquer teste que importe um módulo marcado com
// `import "server-only"`. Aqui ele não faz nada.
export {};
