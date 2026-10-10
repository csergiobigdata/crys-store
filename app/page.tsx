import {
  CreditCard,
  Gift,
  Heart,
  RotateCcw,
  ShieldCheck,
  Truck,
} from "lucide-react";
import Image from "next/image";
import { AnimatedSection } from "@/components/ui/animated-section";
import { ButtonLink } from "@/components/ui/button";
import { isCardPaymentEnabled } from "@/lib/mercadopago/card-enabled";

const trustBadges = (cardEnabled: boolean) => [
  {
    icon: CreditCard,
    label: cardEnabled ? "Pix ou cartão em até 6x" : "Pix agora · cartão em até 6x em breve",
  },
  { icon: Truck, label: "Entrega para todo o Brasil" },
  { icon: RotateCcw, label: "7 dias para troca ou devolução" },
  { icon: ShieldCheck, label: "Compra 100% segura" },
];

export default function HomePage() {
  const cardEnabled = isCardPaymentEnabled();

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-light via-blush to-sky-light">
        {/* Formas decorativas */}
        <div
          aria-hidden="true"
          className="absolute -left-16 top-24 h-56 w-56 rounded-full bg-sky/40"
        />
        <div
          aria-hidden="true"
          className="bg-dots absolute right-6 top-6 h-40 w-40 opacity-60"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-20 right-1/3 h-64 w-64 rounded-full bg-rose/20"
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24 lg:px-8">
          <div>
            <AnimatedSection>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-rose-dark shadow-card">
                <Heart className="h-4 w-4 fill-rose text-rose" aria-hidden="true" />
                Feito com carinho para você
              </p>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <h1 className="font-display text-4xl font-semibold leading-tight text-plum sm:text-5xl md:text-6xl">
                Peças artesanais que{" "}
                <span className="text-rose">encantam</span> e presenteiam
              </h1>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <p className="mt-6 max-w-md text-base text-plum-soft sm:text-lg">
                Acessórios, itens de casa e decoração e kits de presente
                escolhidos a dedo.{" "}
                {cardEnabled
                  ? "Pague no Pix ou no cartão, em até 6x."
                  : "Pague no Pix ou no cartão, em até 6x (em breve disponível)."}
              </p>
            </AnimatedSection>
            <AnimatedSection delay={0.3}>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/catalogo" size="lg">
                  Ver catálogo completo
                </ButtonLink>
                <ButtonLink
                  href="/catalogo?categoria=mimos"
                  variant="outline"
                  size="lg"
                >
                  Ideias de presente
                </ButtonLink>
              </div>
            </AnimatedSection>
          </div>

          <AnimatedSection delay={0.2} className="relative mx-auto w-full max-w-md">
            <div
              aria-hidden="true"
              className="bg-stripes absolute -left-6 -top-6 h-32 w-32 rounded-full opacity-70"
            />
            <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] rounded-b-[2.5rem] border-8 border-white bg-rose-light shadow-card-hover">
              <Image
                src="https://images.pexels.com/photos/5704738/pexels-photo-5704738.jpeg?auto=compress&cs=tinysrgb&w=960"
                alt=""
                fill
                priority
                sizes="(min-width: 768px) 28rem, 90vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-card-hover">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-light text-sky-dark">
                <Gift className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold text-plum">
                Embalagem para presente
              </span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
          {trustBadges(cardEnabled).map(({ icon: Icon, label }, index) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-2xl bg-blush p-3 text-sm font-medium text-plum-soft"
            >
              <span
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                  index % 2 === 0
                    ? "bg-rose-light text-rose-dark"
                    : "bg-sky-light text-sky-dark"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-r from-rose to-rose-dark">
        <div
          aria-hidden="true"
          className="bg-dots absolute -left-6 bottom-0 h-40 w-40 opacity-40"
        />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:px-8">
          <AnimatedSection>
            <h2 className="font-display text-3xl font-semibold text-white">
              {cardEnabled
                ? "Pix com confirmação rápida ou cartão em até 6x"
                : "Pix com confirmação rápida ou cartão em até 6x (em breve)"}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/90">
              {cardEnabled
                ? "Escolha a forma de pagamento que preferir no checkout. QR Code Pix gerado na hora ou cartão de crédito processado com segurança pelo Mercado Pago."
                : "O pagamento é feito por Pix, com QR Code gerado na hora. O parcelamento no cartão de crédito em até 6x ainda não está liberado, mas em breve você poderá comprar com ele."}
            </p>
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <ButtonLink
              href="/catalogo"
              size="lg"
              className="!bg-white !text-rose-dark hover:!bg-sky-light"
            >
              Começar a comprar
            </ButtonLink>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
