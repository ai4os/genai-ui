export function normalizeLatexDelimiters(text: string): string {
  return text
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((part, i) =>
      i % 2 === 1
        ? part
        : part
            // \[ ... \]  ->  block $$ ... $$
            .replace(
              /(?<!\\)\\\[([\s\S]+?)\\\]/g,
              (_, m: string) => `\n$$\n${m.trim()}\n$$\n`,
            )
            // \( ... \)  ->  inline $ ... $
            .replace(/\\\(([\s\S]+?)\\\)/g, (_, m: string) => `$${m.trim()}$`),
    )
    .join("");
}