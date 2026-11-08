"use client";

import { useEffect, useState } from "react";

const attributes = [
  { value: "cor", label: "Cor" },
  { value: "material", label: "Material" },
  { value: "tamanho", label: "Tamanho" },
  { value: "modelo", label: "Modelo" },
  { value: "estampa", label: "Estampa" },
  { value: "personalizacao", label: "Personalização" },
  { value: "acabamento", label: "Acabamento" },
  { value: "formato", label: "Formato" },
];

const colors = [
  "Branco",
  "Rosa",
  "Azul",
  "Preto",
  "Amarelo",
  "Verde",
  "Roxo",
  "Azul marinho",
  "Azul claro",
  "Verde claro",
  "Verde escuro",
  "Cinza claro",
  "Cinza escuro",
  "Vermelho",
  "Laranja",
  "Marrom",
  "Bege",
  "Creme",
  "Off-white",
  "Rosa claro",
  "Pink",
  "Lilás",
  "Turquesa",
  "Vinho",
  "Prata",
  "Dourado",
  "Cobre",
];

const customColor = "__outra_cor__";
const fieldClass =
  "mt-1 w-full rounded-lg border border-rose/30 bg-surface px-2 py-1.5 text-sm";

export function VariantAttributeFields({
  index,
  idPrefix,
  defaultKey = "",
  defaultValue = "",
  required = false,
  className,
  onValidityChange,
}: {
  index: 1 | 2;
  idPrefix: string;
  defaultKey?: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
  onValidityChange?: () => void;
}) {
  const isKnownColor = colors.includes(defaultValue);
  const [attribute, setAttribute] = useState(defaultKey);
  const [specification, setSpecification] = useState(defaultValue);
  const [isCustomColorSelected, setIsCustomColorSelected] = useState(
    defaultKey === "cor" && Boolean(defaultValue) && !isKnownColor,
  );
  const keyName = `attributeKey${index}`;
  const valueName = `attributeValue${index}`;
  const keyId = `${idPrefix}-${keyName}`;
  const valueId = `${idPrefix}-${valueName}`;
  const needsSpecification = attribute !== "" && attribute !== "nenhum";

  useEffect(() => {
    onValidityChange?.();
  }, [attribute, specification, isCustomColorSelected, onValidityChange]);

  return (
    <>
      <div className={className}>
        <label className="block text-xs text-plum-soft" htmlFor={keyId}>
          Atributo {index}
        </label>
        <select
          id={keyId}
          name={keyName}
          value={attribute}
          required={required}
          onChange={(event) => {
            setAttribute(event.target.value);
            setSpecification("");
            setIsCustomColorSelected(false);
          }}
          className={fieldClass}
        >
          <option value="">Selecione</option>
          <option value="nenhum">Sem atributo</option>
          {attributes.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {defaultKey && !attributes.some((option) => option.value === defaultKey) && (
            <option value={defaultKey}>{defaultKey}</option>
          )}
        </select>
      </div>

      <div className={className}>
        <label className="block text-xs text-plum-soft" htmlFor={valueId}>
          Especificação {index}
        </label>
        {attribute === "cor" ? (
          <>
            <select
              id={valueId}
              name={valueName}
              value={isCustomColorSelected ? customColor : specification}
              required={required}
              onChange={(event) => {
                const value = event.target.value;
                const custom = value === customColor;
                setIsCustomColorSelected(custom);
                setSpecification(custom ? "" : value);
              }}
              className={fieldClass}
            >
              <option value="">Selecione a cor</option>
              {colors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
              <option value={customColor}>Outra cor...</option>
            </select>
            {isCustomColorSelected && (
              <input
                name={`${valueName}Custom`}
                value={specification}
                onChange={(event) => setSpecification(event.target.value)}
                placeholder="Informe a cor"
                required={required}
                className={fieldClass}
              />
            )}
          </>
        ) : needsSpecification || attribute === "nenhum" ? (
          <input
            id={valueId}
            name={valueName}
            value={specification}
            onChange={(event) => setSpecification(event.target.value)}
            required={required && needsSpecification}
            placeholder={needsSpecification ? "Ex.: Algodão" : "Opcional"}
            className={fieldClass}
          />
        ) : (
          <input id={valueId} name={valueName} type="hidden" value="" readOnly />
        )}
      </div>
    </>
  );
}
