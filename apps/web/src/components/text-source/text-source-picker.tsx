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

export interface TextSourceValue<Kind extends TextSourceKind = TextSourceKind> {
  textSource: Kind;
  language: Language;
}

/**
 * Gibberish, Words or Sentences, and the Language for real text. Gibberish's
 * keys are picked with the Key Set picker, shown next to this one. `kinds`
 * narrows the choice, like the Leaderboard's to real text.
 */
export function TextSourcePicker<Kind extends TextSourceKind = TextSourceKind>({
  value,
  onChange,
  kinds = TEXT_SOURCE_KINDS as readonly Kind[],
  disabled = false,
}: {
  value: TextSourceValue<Kind>;
  onChange: (value: TextSourceValue<Kind>) => void;
  kinds?: readonly Kind[];
  disabled?: boolean;
}) {
  const t = useTranslations("TextSource");
  const kindLabel = (kind: TextSourceKind) => t(`kinds.${kind}`);

  return (
    <div className="flex flex-col gap-3">
      <ChoiceGroup
        disabled={disabled}
        legend={t("title")}
        name="text-source"
        options={kinds.map((kind) => ({
          value: kind,
          label: kindLabel(kind),
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
