"use client";

import Image from "next/image";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { deleteProductImageAction, uploadProductImageAction } from "@/lib/admin/product-actions";

type ProductImage = { id: string; url: string; alt_text: string };

export function ImageManager({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
  const action = uploadProductImageAction.bind(null, productId);
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <div>
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((image) => (
            <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg">
              <Image src={image.url} alt={image.alt_text} fill className="object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-plum/60 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={async () => {
                    await deleteProductImageAction(productId, image.id);
                  }}
                  className="rounded-full bg-error px-3 py-1.5 text-xs font-medium text-blush"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form action={formAction} className="mt-4 flex flex-wrap items-end gap-3">
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          required
          className="text-sm text-plum-soft"
        />
        <input
          name="altText"
          placeholder="Texto alternativo (ex.: Bolsa dourada, vista frontal)"
          required
          className="min-w-[260px] flex-1 rounded-lg border border-rose/30 px-3 py-2 text-sm"
        />
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "Enviando..." : "Adicionar foto"}
        </Button>
      </form>
      {state?.error && (
        <p className="mt-2 rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
          {state.error}
        </p>
      )}
    </div>
  );
}
