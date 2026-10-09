"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getServerCart, syncServerCartItem } from "@/lib/cart/actions";
import { type CartLine, MAX_QUANTITY_PER_ITEM } from "@/lib/cart/types";

const STORAGE_KEY = "chrys-cart";
// Marca que o carrinho local já foi unido ao da conta nesta sessão de login.
// Sem ela, cada recarregamento somaria o carrinho local ao do servidor de novo
// e a quantidade dobraria a cada página aberta.
const SYNCED_KEY = "chrys-cart-synced";
// Espera o cliente parar de clicar em +/- antes de gravar no servidor: só o
// valor final de cada item viaja, em vez de uma chamada por clique.
const SYNC_DELAY_MS = 400;

type CartContextValue = {
  lines: CartLine[];
  itemCount: number;
  hydrated: boolean;
  addItem: (variantId: string, quantity: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readLocalCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

function writeLocalCart(lines: CartLine[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // localStorage indisponível (modo privado, cookies bloqueados, etc.) —
    // o carrinho continua funcionando só na memória da sessão atual.
  }
}

function readSyncedFlag(): boolean {
  try {
    return localStorage.getItem(SYNCED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSyncedFlag(value: boolean) {
  try {
    if (value) localStorage.setItem(SYNCED_KEY, "1");
    else localStorage.removeItem(SYNCED_KEY);
  } catch {
    // sem localStorage: segue sem a marca
  }
}

function mergeLines(a: CartLine[], b: CartLine[]): CartLine[] {
  const map = new Map<string, number>();
  for (const line of [...a, ...b]) {
    map.set(line.variantId, (map.get(line.variantId) ?? 0) + line.quantity);
  }
  return Array.from(map.entries()).map(([variantId, quantity]) => ({
    variantId,
    quantity,
  }));
}

export function CartProvider({
  isLoggedIn,
  children,
}: {
  isLoggedIn: boolean;
  children: ReactNode;
}) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const local = readLocalCart();

      if (isLoggedIn) {
        const server = await getServerCart();
        if (readSyncedFlag()) {
          // Já unido nesta sessão: o servidor é a fonte da verdade.
          if (!cancelled) {
            setLines(server);
            writeLocalCart(server);
          }
        } else {
          // Primeiro carregamento logado: une o carrinho de visitante ao da conta.
          const merged = mergeLines(local, server);
          if (!cancelled) {
            setLines(merged);
            writeLocalCart(merged);
            writeSyncedFlag(true);
          }
          merged.forEach((line) => {
            void syncServerCartItem(line.variantId, line.quantity);
          });
        }
      } else if (!cancelled) {
        if (readSyncedFlag()) {
          // O cliente acabou de sair da conta: o carrinho dela não fica no navegador.
          writeSyncedFlag(false);
          writeLocalCart([]);
          setLines([]);
        } else {
          setLines(local);
        }
      }

      if (!cancelled) setHydrated(true);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const syncTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const applyChange = useCallback(
    (variantId: string, requested: number) => {
      const quantity = Math.min(requested, MAX_QUANTITY_PER_ITEM);
      setLines((prev) => {
        const next =
          quantity <= 0
            ? prev.filter((l) => l.variantId !== variantId)
            : prev.some((l) => l.variantId === variantId)
              ? prev.map((l) => (l.variantId === variantId ? { ...l, quantity } : l))
              : [...prev, { variantId, quantity }];
        writeLocalCart(next);
        return next;
      });
      if (isLoggedIn) {
        const timers = syncTimers.current;
        clearTimeout(timers.get(variantId));
        timers.set(
          variantId,
          setTimeout(() => {
            timers.delete(variantId);
            void syncServerCartItem(variantId, quantity);
          }, SYNC_DELAY_MS),
        );
      }
    },
    [isLoggedIn],
  );

  const addItem = useCallback(
    (variantId: string, quantity: number) => {
      const existing = lines.find((l) => l.variantId === variantId);
      applyChange(variantId, (existing?.quantity ?? 0) + quantity);
    },
    [lines, applyChange],
  );

  const setQuantity = useCallback(
    (variantId: string, quantity: number) => applyChange(variantId, quantity),
    [applyChange],
  );

  const removeItem = useCallback(
    (variantId: string) => applyChange(variantId, 0),
    [applyChange],
  );

  const clear = useCallback(() => {
    setLines([]);
    writeLocalCart([]);
  }, []);

  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines],
  );

  const value = useMemo(
    () => ({ lines, itemCount, hydrated, addItem, setQuantity, removeItem, clear }),
    [lines, itemCount, hydrated, addItem, setQuantity, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart deve ser usado dentro de <CartProvider>.");
  }
  return ctx;
}
