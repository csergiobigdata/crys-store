"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { VariantAttributeFields } from "@/components/admin/products/variant-attribute-fields";
import {
  createProductWithDetailsAction,
  suggestProductFields,
  suggestProductSlug,
} from "@/lib/admin/product-actions";
import { Button } from "@/components/ui/button";

type Category = { id: string; name: string };

export function ProductCreationForm({ categories }: { categories: Category[] }) {
  const [state, formAction, pending] = useActionState(createProductWithDetailsAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [skuTouched, setSkuTouched] = useState(false);
  const [duplicateName, setDuplicateName] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [slugSuggestion, setSlugSuggestion] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const imagePreviewRef = useRef<string | null>(null);
  const [formValid, setFormValid] = useState(false);

  useEffect(() => {
    return () => {
      if (imagePreviewRef.current) URL.revokeObjectURL(imagePreviewRef.current);
    };
  }, []);

  useEffect(() => {
    if (name.trim().length < 2) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      suggestProductFields(name)
        .then((result) => {
          if (cancelled) return;
          if ("error" in result) {
            setSuggestionError(result.error ?? "Não foi possível verificar os dados do produto.");
            return;
          }
          setSuggestionError(null);
          setDuplicateName(result.duplicateName);
          if (!slugTouched) setSlug(result.slug);
          if (!skuTouched) setSku(result.sku);
          window.requestAnimationFrame(() =>
            setFormValid(formRef.current?.checkValidity() ?? false),
          );
        })
        .catch(() => {
          if (!cancelled) {
            setSuggestionError("Não foi possível gerar as sugestões agora. Você pode preencher os campos manualmente.");
          }
        });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [name, slugTouched, skuTouched]);

  function updateFormValidity() {
    window.requestAnimationFrame(() =>
      setFormValid(formRef.current?.checkValidity() ?? false),
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      encType="multipart/form-data"
      onInput={updateFormValidity}
      onChange={updateFormValidity}
      className="space-y-6"
    >
      <section className="space-y-4 rounded-2xl border border-rose-light bg-surface p-5">
        <h2 className="font-display text-lg text-plum">Dados do produto</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="product-name" className="block text-sm font-medium text-plum">
              Nome
            </label>
            <input
              id="product-name"
              name="name"
              required
              minLength={2}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setDuplicateName(false);
                setSuggestionError(null);
                setSlugSuggestion(null);
                if (!slugTouched) setSlug("");
                if (!skuTouched) setSku("");
              }}
              className="mt-1.5 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
            />
            {duplicateName && (
              <p className="mt-2 text-xs text-error" role="status">
                Já existe um produto com esse nome. Diferencie-o por uma característica, como cor,
                tipo de pano ou material.
              </p>
            )}
          </div>
          <div>
            <label htmlFor="product-slug" className="block text-sm font-medium text-plum">
              Slug
            </label>
            <input
              id="product-slug"
              name="slug"
              required
              minLength={2}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={slug}
              onChange={(event) => {
                const value = event.target.value.toLowerCase();
                setSlug(value);
                setSlugTouched(true);
                setSlugSuggestion(null);
                if (!skuTouched) setSku(value.toUpperCase());
              }}
              onBlur={(event) => {
                const typedSlug = event.currentTarget.value;
                if (!typedSlug.trim()) return;

                suggestProductSlug(typedSlug)
                  .then((result) => {
                    if ("error" in result) {
                      setSuggestionError(result.error ?? "Não foi possível verificar o slug.");
                      return;
                    }
                    const currentSlug = String(
                      new FormData(formRef.current ?? undefined).get("slug") ?? "",
                    );
                    if (currentSlug !== typedSlug) return;
                    setSlug(result.slug);
                    setSlugSuggestion(
                      result.adjusted
                        ? `Esse slug já estava em uso; sugestão: ${result.slug}.`
                        : null,
                    );
                    if (!skuTouched) setSku(result.sku);
                    window.requestAnimationFrame(() =>
                      setFormValid(formRef.current?.checkValidity() ?? false),
                    );
                  })
                  .catch(() => {
                    setSuggestionError("Não foi possível verificar o slug agora.");
                  });
              }}
              placeholder="pano-de-prato-galo"
              className="mt-1.5 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-plum-soft">
              Gerado a partir do nome; se já existir, recebe um número sequencial.
            </p>
            {slugSuggestion && (
              <p className="mt-1 text-xs text-rose-dark" role="status">
                {slugSuggestion}
              </p>
            )}
          </div>
        </div>

        {suggestionError && (
          <p className="text-xs text-error" role="status">
            {suggestionError}
          </p>
        )}

        <div>
          <label htmlFor="product-description" className="block text-sm font-medium text-plum">
            Descrição
          </label>
          <textarea
            id="product-description"
            name="description"
            required
            rows={4}
            className="mt-1.5 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="product-price" className="block text-sm font-medium text-plum">
              Preço base (R$)
            </label>
            <input
              id="product-price"
              name="basePrice"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              required
              className="mt-1.5 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="product-category" className="block text-sm font-medium text-plum">
              Categoria
            </label>
            <select
              id="product-category"
              name="categoryId"
              required
              defaultValue=""
              className="mt-1.5 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-lg border border-rose/30 px-3 py-3 text-sm">
          <input type="checkbox" name="isTest" className="mt-0.5 h-4 w-4" />
          <span>
            <span className="font-medium text-plum">Produto de teste</span>
            <span className="mt-0.5 block text-xs text-plum-soft">
              Não será exibido no catálogo nem poderá ser comprado por clientes.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-lg border border-rose/30 px-3 py-3 text-sm">
          <input type="checkbox" name="isCustomized" className="mt-0.5 h-4 w-4" />
          <span>
            <span className="font-medium text-plum">Produto customizado</span>
            <span className="mt-0.5 block text-xs text-plum-soft">
              Uma unidade tem prazo de preparação de até 5 dias; para 2 ou mais, a data deve ser
              combinada com a loja.
            </span>
          </span>
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-rose-light bg-surface p-5">
        <h2 className="font-display text-lg text-plum">Fotos</h2>
        <div>
          <label htmlFor="product-photo" className="block text-sm font-medium text-plum">
            Foto principal
          </label>
          <input
            id="product-photo"
            name="productImage"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (imagePreviewRef.current) {
                URL.revokeObjectURL(imagePreviewRef.current);
              }
              imagePreviewRef.current = file ? URL.createObjectURL(file) : null;
              setImagePreviewUrl(imagePreviewRef.current);
              updateFormValidity();
            }}
            className="mt-1.5 block w-full text-sm text-plum-soft file:mr-3 file:rounded-full file:border file:border-rose/40 file:bg-white file:px-4 file:py-2 file:text-sm file:text-rose-dark"
          />
          <p className="mt-1 text-xs text-plum-soft">JPEG, PNG, WebP ou GIF; até 5 MB.</p>
          {imagePreviewUrl && (
            <Image
              src={imagePreviewUrl}
              alt={`Prévia da foto de ${name || "produto"}`}
              width={160}
              height={160}
              unoptimized
              className="mt-3 h-40 w-40 rounded-xl border border-rose/20 object-cover"
            />
          )}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-rose-light bg-surface p-5">
        <div>
          <h2 className="font-display text-lg text-plum">SKU, especificação e estoque</h2>
          <p className="mt-1 text-sm text-plum-soft">
            Cadastre pelo menos uma variação. O estoque inicial sugerido é 1.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="variant-sku" className="block text-sm font-medium text-plum">
              SKU
            </label>
            <input
              id="variant-sku"
              name="sku"
              required
              minLength={1}
              value={sku}
              onChange={(event) => {
                setSku(event.target.value);
                setSkuTouched(true);
              }}
              className="mt-1.5 w-full rounded-lg border border-rose/30 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="variant-price" className="block text-sm font-medium text-plum">
              Preço específico (opcional)
            </label>
            <input
              id="variant-price"
              name="priceOverride"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              className="mt-1.5 w-full min-w-40 rounded-lg border border-rose/30 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="variant-stock" className="block text-sm font-medium text-plum">
              Estoque
            </label>
            <input
              id="variant-stock"
              name="stockQuantity"
              type="number"
              min="0"
              max="2147483647"
              required
              defaultValue={1}
              className="mt-1.5 w-full min-w-40 rounded-lg border border-rose/30 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <VariantAttributeFields
              index={1}
              idPrefix="new-product"
              required
              onValidityChange={updateFormValidity}
            />
          </div>
        </div>
        <input type="hidden" name="active" value="on" />
      </section>

      {state?.error && (
        <p className="rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending || !formValid || duplicateName}>
        {pending ? "Salvando..." : "Salvar produto"}
      </Button>
    </form>
  );
}
