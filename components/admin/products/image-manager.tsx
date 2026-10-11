"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteProductImageAction, uploadProductImageAction } from "@/lib/admin/product-actions";

type ProductImage = { id: string; url: string; alt_text: string };

export function ImageManager({
  productId,
  productName,
  images,
}: {
  productId: string;
  productName: string;
  images: ProductImage[];
}) {
  const action = uploadProductImageAction.bind(null, productId);
  const [state, formAction, pending] = useActionState(action, undefined);

  const fileInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Libera a URL temporária anterior ao trocar/limpar a pré-visualização.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

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

      <form
        action={formAction}
        onReset={() => setPreview(null)}
        className="mt-4"
      >
        <input
          ref={fileInput}
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : null);
          }}
          className="hidden"
        />

        {!preview && (
          <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
            Adicionar foto
          </Button>
        )}

        {preview && (
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <p className="text-xs font-medium text-plum-soft">
                Pré-visualização — confira se é a foto correta:
              </p>
              <div className="relative mt-2 aspect-[4/5] w-40 overflow-hidden rounded-lg border border-rose/30">
                <Image src={preview} alt="Pré-visualização da foto selecionada" fill unoptimized className="object-cover" />
              </div>
            </div>
            <div className="flex min-w-[260px] flex-1 flex-col gap-3">
              <label className="text-xs font-medium text-plum-soft" htmlFor="altText">
                Texto alternativo (descrição da foto)
              </label>
              <input
                id="altText"
                name="altText"
                defaultValue={productName}
                required
                className="rounded-lg border border-rose/30 px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <Button type="submit" variant="outline" size="sm" disabled={pending}>
                  {pending ? "Enviando..." : "Salvar foto"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    if (fileInput.current) fileInput.current.value = "";
                    setPreview(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
      {state?.error && (
        <p className="mt-2 rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
          {state.error}
        </p>
      )}
    </div>
  );
}
