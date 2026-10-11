import Link from "next/link";

/** Aviso exibido enquanto o administrador mantém as vendas pausadas. */
export function SalesPausedNotice({
  phone,
  className = "",
}: {
  phone: string | null;
  className?: string;
}) {
  return (
    <div role="status" className={`bg-rose-light/60 px-4 py-3 text-center text-sm text-plum ${className}`}>
      <strong>Vendas pausadas temporariamente.</strong> Você pode navegar e conhecer os produtos,
      mas as compras foram pausadas pelo administrador. Em caso de dúvida, envie uma mensagem em{" "}
      <Link href="/fale-conosco" className="font-medium text-rose-dark underline">
        Fale Conosco
      </Link>
      {phone ? (
        <>
          {" "}
          ou ligue para <span className="font-medium">{phone}</span>
        </>
      ) : null}
      .
    </div>
  );
}
