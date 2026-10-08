import type { ReactNode } from "react";

export function LegalLayout({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-plum">{title}</h1>
      <p className="mt-2 text-sm text-plum-soft">
        Última atualização: {updatedAt}
      </p>

      <div
        className="mt-8 space-y-4 text-sm leading-relaxed text-plum-soft
          [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-plum
          [&_strong]:font-medium [&_strong]:text-plum
          [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
      >
        {children}
      </div>
    </div>
  );
}
