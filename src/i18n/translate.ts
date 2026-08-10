import type { Messages } from "./get-dictionary";

/** Dot-path keys into the nested messages object. */
export type MessageKey = JoinKeys<Messages>;

type JoinKeys<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? Prefix extends ""
      ? K
      : `${Prefix}.${K}`
    : T[K] extends object
      ? JoinKeys<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>
      : never;
}[keyof T & string];

export type TranslateParams = Record<string, string | number>;

function resolvePath(messages: Messages, key: string): string | undefined {
  const parts = key.split(".");
  let current: unknown = messages;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const value = params[name];
    return value == null ? `{${name}}` : String(value);
  });
}

export function createTranslator(messages: Messages) {
  return function t(key: MessageKey | string, params?: TranslateParams): string {
    const raw = resolvePath(messages, key);
    if (raw == null) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[i18n] Missing message: ${key}`);
      }
      return key;
    }
    return interpolate(raw, params);
  };
}

export type Translator = ReturnType<typeof createTranslator>;
