"use client";

import {
  generateText,
  LANGUAGES,
  TEXT_SOURCE_KINDS,
  type Language,
  type TextSourceKind,
} from "@typerace/game";
import { useTranslations } from "next-intl";
import { ChoiceGroup } from "@/components/choice-group";

export interface TextSourceValue {
  textSource: TextSourceKind;
  language: Language;
}

/**
 * Gibberish, Words or Sentences, and the Language for real text. Gibberish's
 * keys are picked with the Key Set picker, shown next to this one.
 */
export function TextSourcePicker({
  value,
  onChange,
  disabled = false,
}: {
  value: TextSourceValue;
  onChange: (value: TextSourceValue) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("TextSource");

  return (
    <div className="flex flex-col gap-3">
      <ChoiceGroup
        disabled={disabled}
        legend={t("title")}
        name="text-source"
        options={TEXT_SOURCE_KINDS.map((kind) => ({
          value: kind,
          label: t(`kinds.${kind}`),
        }))}
        value={value.textSource}
        onChange={(textSource) => onChange({ ...value, textSource })}
      />
      {value.textSource !== "gibberish" && (
        <>
          <ChoiceGroup
            disabled={disabled}
            legend={t("language")}
            name="language"
            options={LANGUAGES.map((language) => ({
              value: language,
              label: t(`languages.${language}`),
            }))}
            value={value.language}
            onChange={(language) => onChange({ ...value, language })}
          />
          <p
            className="text-sm text-muted-foreground"
            data-testid="text-sample"
          >
            {t("sample")}{" "}
            <span className="font-mono text-foreground">
              {generateText(
                { kind: value.textSource, language: value.language },
                { seed: 1, minLength: 60 },
              )}
            </span>
          </p>
        </>
      )}
    </div>
  );
}
