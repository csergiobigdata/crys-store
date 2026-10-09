import type { Metadata } from "next";
import { ContactForm } from "@/components/site/contact-form";
import { getCurrentUser } from "@/lib/auth/session";
import { getPrimaryAdminContact } from "@/lib/site/contact";

export const metadata: Metadata = {
  title: "Fale Conosco",
  description: "Envie uma mensagem para a equipe da Chrys Store.",
};

export default async function ContactPage() {
  const [user, primaryAdmin] = await Promise.all([getCurrentUser(), getPrimaryAdminContact()]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-plum">Fale Conosco</h1>
      <p className="mt-2 text-plum-soft">
        Tem uma dúvida, sugestão ou precisa de ajuda com um pedido? Escreva abaixo: a sua
        mensagem chega a todos os administradores da loja e a resposta vai para o seu e-mail.
      </p>

      <div className="mt-8 rounded-2xl border border-rose-light bg-surface p-6 shadow-card">
        <ContactForm
          defaultName={user?.fullName ?? ""}
          defaultEmail={user?.email ?? ""}
          defaultPhone={user?.phone ?? ""}
        />
      </div>

      {(primaryAdmin?.email || primaryAdmin?.phone) && (
        <p className="mt-6 text-sm text-plum-soft">
          Prefere falar direto?{" "}
          {primaryAdmin?.email && (
            <a href={`mailto:${primaryAdmin.email}`} className="font-medium text-rose-dark hover:underline">
              {primaryAdmin.email}
            </a>
          )}
          {primaryAdmin?.email && primaryAdmin?.phone ? " · " : ""}
          {primaryAdmin?.phone}
        </p>
      )}
    </div>
  );
}
