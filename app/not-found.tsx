import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-6xl text-rose-dark">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold text-plum">
        Página não encontrada
      </h1>
      <p className="mt-2 text-plum-soft">
        O link pode estar desatualizado, ou a página pode ter sido movida.
      </p>
      <ButtonLink href="/catalogo" className="mt-8">
        Ver catálogo
      </ButtonLink>
    </div>
  );
}
