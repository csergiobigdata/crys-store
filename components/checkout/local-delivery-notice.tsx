import { MessageCircleWarning } from "lucide-react";

/**
 * Aviso em destaque para quem escolhe "Entrega local": a loja só despacha o
 * pedido depois de combinar a entrega com o cliente.
 */
export function LocalDeliveryNotice({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="note"
      className={`flex gap-3 rounded-xl border-2 border-rose bg-rose-light/60 p-4 text-sm text-plum ${className}`}
    >
      <MessageCircleWarning className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-dark" aria-hidden="true" />
      <div>
        <p className="font-semibold text-rose-dark">Entrega local: combine com a loja</p>
        <p className="mt-1">
          {compact
            ? "A loja só despacha o seu pedido depois de combinar a entrega com você."
            : "Para a loja despachar o seu pedido, você precisa combinar a entrega com ela (dia, horário e local). Depois de finalizar o pedido, a loja entra em contato; se preferir, fale com a loja primeiro. O pedido só é despachado depois desse combinado."}
        </p>
      </div>
    </div>
  );
}
