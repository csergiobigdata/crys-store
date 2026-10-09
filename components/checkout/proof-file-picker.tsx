"use client";

import { FileText, ImageUp, Trash2, UploadCloud } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { cn } from "@/lib/utils/cn";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/**
 * Seletor do comprovante: área grande para clicar ou arrastar o arquivo, com
 * pré-visualização, nome e tamanho, e validação de tipo e tamanho antes de
 * enviar. O <input type="file"> real fica dentro do formulário, então o envio
 * continua sendo o do formulário (campo "file").
 */
export function ProofFilePicker({
  name = "file",
  onChange,
}: {
  name?: string;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  // Libera a URL da pré-visualização quando o arquivo muda ou o componente sai da tela.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function choose(next: File | null) {
    if (!next) {
      setFile(null);
      setPreviewUrl(null);
      setProblem(null);
      onChange(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(next.type)) {
      setProblem("Formato não aceito. Envie uma imagem (JPG, PNG ou WebP) ou um PDF.");
      clearInput();
      return;
    }
    if (next.size > MAX_SIZE_BYTES) {
      setProblem(`O arquivo tem ${formatSize(next.size)}. O limite é de 5 MB.`);
      clearInput();
      return;
    }
    setProblem(null);
    setFile(next);
    setPreviewUrl(next.type.startsWith("image/") ? URL.createObjectURL(next) : null);
    onChange(next);
  }

  function clearInput() {
    if (inputRef.current) inputRef.current.value = "";
    setFile(null);
    setPreviewUrl(null);
    onChange(null);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (!dropped) return;
    // Coloca o arquivo solto dentro do input do formulário, para ele ser enviado.
    if (inputRef.current) {
      const transfer = new DataTransfer();
      transfer.items.add(dropped);
      inputRef.current.files = transfer.files;
    }
    choose(dropped);
  }

  return (
    <div>
      <input
        ref={inputRef}
        id="proof-file"
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="sr-only"
        onChange={(event) => choose(event.target.files?.[0] ?? null)}
      />

      {file ? (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-success/40 bg-success-light/50 p-3">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Pré-visualização do comprovante"
              className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-white">
              <FileText className="h-7 w-7 text-rose-dark" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-plum">{file.name}</p>
            <p className="text-xs text-plum-soft">{formatSize(file.size)} — pronto para enviar</p>
            <label
              htmlFor="proof-file"
              className="mt-1 inline-block cursor-pointer text-xs font-medium text-rose-dark hover:underline"
            >
              Trocar arquivo
            </label>
          </div>
          <button
            type="button"
            onClick={clearInput}
            aria-label="Remover arquivo escolhido"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-plum-soft hover:bg-white hover:text-error"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor="proof-file"
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors",
            dragging
              ? "border-rose bg-rose-light/70"
              : "border-rose/50 bg-white hover:border-rose hover:bg-rose-light/30",
          )}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-light text-rose-dark">
            {dragging ? (
              <ImageUp className="h-6 w-6" aria-hidden="true" />
            ) : (
              <UploadCloud className="h-6 w-6" aria-hidden="true" />
            )}
          </span>
          <span className="text-sm font-semibold text-rose-dark">
            {dragging ? "Solte o arquivo aqui" : "Toque aqui para escolher o comprovante"}
          </span>
          <span className="text-xs text-plum-soft">
            ou arraste o arquivo até aqui — imagem (JPG, PNG, WebP) ou PDF, até 5 MB
          </span>
        </label>
      )}

      {problem && (
        <p className="mt-2 rounded-lg bg-error-light px-3 py-2 text-sm text-error" role="alert">
          {problem}
        </p>
      )}
    </div>
  );
}
