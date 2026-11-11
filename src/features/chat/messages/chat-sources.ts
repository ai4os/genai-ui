/**
 * Separates the block of sources that some models/agents append as the last
 * paragraph/line of the response ("Source: [a.csv](...) and [b.pdf](...)").
 */

// Known labels
const KNOWN_LABELS = new Set([
  "fuente", "fuentes", // es
  "source", "sources", // en / fr
  "fonte", "fontes", "fonti", // pt / gl / it
  "font", "fonts", // ca
  "quelle", "quellen", // de
  "bron", "bronnen", // nl
  "källa", "källor", // sv
  "kilde", "kilder", // da / no
  "źródło", "źródła", // pl
  "источник", "источники", // ru
  "出典", "来源", "來源", "출처", // ja / zh / ko
]);

// Label: detects "Source:", "**Sources**:", optionally preceded by quotes or line breaks
const LABEL_LINE_RE =
  /(?:^|\n)[ \t]*["'«“]?(?:\*\*|__)?(\p{L}[\p{L}\p{M}]*(?: \p{L}[\p{L}\p{M}]*){0,2})(?:\*\*|__)?[ \t]*[:：](?:\*\*|__)?[ \t]*([\s\S]*)$/u;

// File extension & link patterns
const LINK_RE = /\[([^\]]*)\]\(([^)]*)\)/g;
const LINK_TEXT_IS_FILE_RE = /\.(?=\d*[A-Za-z])[A-Za-z0-9]{1,5}$/;
const URL_RE = /^https?:\/\/[^\s)]+$/i;
const BARE_FILE_RE =
  /[\p{L}\p{N}_-]+(?:\.[\p{L}\p{N}_-]+)*\.(?=\d*[A-Za-z])[A-Za-z0-9]{1,5}(?![\p{L}\p{N}_])/gu;
const BARE_URL_RE = /https?:\/\/[^\s"')]+/gi;

/** How many characters of "filler" (connectors) are tolerated per source item. */
const MAX_FILLER_PER_SOURCE = 8;

function isSourceList(text: string): boolean {
  const clean = text.replace(/["'»”]$/, "").trim();
  const links = [...clean.matchAll(LINK_RE)];

  const allLinksValid = links.every((l) => {
    const linkText = l[1].trim();
    const linkHref = l[2].trim();
    return LINK_TEXT_IS_FILE_RE.test(linkText) || URL_RE.test(linkHref);
  });

  if (!allLinksValid) return false;

  const withoutLinks = clean.replace(LINK_RE, " ");
  const bareFiles = withoutLinks.match(BARE_FILE_RE) ?? [];
  const bareUrls = withoutLinks.match(BARE_URL_RE) ?? [];
  const sourceCount = links.length + bareFiles.length + bareUrls.length;
  if (!sourceCount) return false;

  const filler = withoutLinks
    .replace(BARE_URL_RE, " ")
    .replace(BARE_FILE_RE, " ")
    .replace(/[^\p{L}\p{N}]+/gu, "");

  return filler.length <= MAX_FILLER_PER_SOURCE * sourceCount;
}

export function splitSources(content: string): {
  body: string;
  sources: { label: string; text: string } | null;
} {
  const none = { body: content, sources: null };
  const trimmed = content.trimEnd();

  // If there is no content or it is inside a code block
  if (!trimmed || trimmed.endsWith("```")) return none;

  // Look for whether the end of the text has a section starting with a label (e.g. "Sources: ...")
  const m = LABEL_LINE_RE.exec(trimmed);
  if (!m) return none;

  const label = m[1];
  // Remove any leftover quotes at the end of the block
  const text = m[2].trim().replace(/["'»”]+$/, "");
  if (!text) return none;

  const isKnown = KNOWN_LABELS.has(label.toLowerCase());
  const isValidList = isSourceList(text);

  // The label must be recognized or the list must be a strict source list
  if (!isKnown && !isValidList) return none;

  // If the label is known, we verify that it contains at least one URL or file
  if (isKnown && !isValidList && !URL_RE.test(text) && !BARE_URL_RE.test(text)) {
    return none;
  }

  // Cut the body just where the label match starts
  const body = trimmed.slice(0, m.index).trimEnd().replace(/["'«“]+$/, "");

  return {
    body,
    sources: { label, text },
  };
}