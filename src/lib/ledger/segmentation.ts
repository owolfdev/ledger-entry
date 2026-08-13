export type SegmentationHint = "single" | "multiple" | "compound" | "unclear";

export type PromptSegmentation = {
  amountLineCount: number;
  completeLineCount: number;
  hint: SegmentationHint;
  reason: string;
  uniqueDateCount: number;
};

const MONTHS =
  "january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec";

const DATE_PATTERNS = [
  /\b\d{4}-\d{2}-\d{2}\b/gi,
  new RegExp(String.raw`\b\d{1,2}(?:st|nd|rd|th)?\s+(?:${MONTHS})\b`, "gi"),
  new RegExp(String.raw`\b(?:${MONTHS})\s+\d{1,2}(?:st|nd|rd|th)?\b`, "gi"),
  /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g,
];

const AMOUNT_PATTERNS = [
  /\b\d+(?:\.\d+)?k\b/gi,
  /\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b/g,
  /\b(?:thb|usd|baht|฿|\$)\s*\d+(?:\.\d+)?\b/gi,
  /\b\d+(?:\.\d+)?\s*(?:thb|usd|baht|฿)\b/gi,
];

function normalizeMatch(value: string) {
  return value.replaceAll(/\s+/g, " ").trim().toLowerCase();
}

function uniqueMatches(value: string, patterns: RegExp[]) {
  const matches = new Set<string>();

  for (const pattern of patterns) {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const globalPattern = new RegExp(pattern.source, flags);
    for (const match of value.matchAll(globalPattern)) {
      matches.add(normalizeMatch(match[0]));
    }
  }

  return [...matches];
}

function stripMatches(value: string, matches: string[]) {
  return matches.reduce(
    (remaining, match) =>
      remaining.replace(
        new RegExp(match.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
        " ",
      ),
    value,
  );
}

function analyzeLine(line: string) {
  const dates = uniqueMatches(line, DATE_PATTERNS);
  const amounts = uniqueMatches(stripMatches(line, dates), AMOUNT_PATTERNS);

  return {
    amounts,
    dates,
    hasAmount: amounts.length > 0,
    hasDate: dates.length > 0,
  };
}

function splitIntoBlocks(prompt: string) {
  return prompt
    .split(/\n\s*\n+/)
    .map((block) =>
      block
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .filter((block) => block.length > 0);
}

function mergeContinuationLines(lines: string[]) {
  const merged: string[] = [];

  for (const line of lines) {
    const analysis = analyzeLine(line);

    if (!analysis.hasAmount && analysis.hasDate && merged.length > 0) {
      merged[merged.length - 1] = `${merged[merged.length - 1]} ${line}`;
      continue;
    }

    merged.push(line);
  }

  return merged;
}

function blockHasAmount(block: string[]) {
  return mergeContinuationLines(block).some((line) => analyzeLine(line).hasAmount);
}

export function analyzePromptSegmentation(prompt: string): PromptSegmentation {
  const blocks = splitIntoBlocks(prompt);
  const mergedLines = blocks.flatMap((block) => mergeContinuationLines(block));
  const lineAnalyses = mergedLines.map(analyzeLine);

  const amountLineCount = lineAnalyses.filter((line) => line.hasAmount).length;
  const completeLineCount = lineAnalyses.filter(
    (line) => line.hasAmount && line.hasDate,
  ).length;
  const uniqueDateCount = new Set(lineAnalyses.flatMap((line) => line.dates)).size;
  const blocksWithAmounts = blocks.filter((block) => blockHasAmount(block)).length;

  if (blocksWithAmounts >= 2) {
    return {
      amountLineCount,
      completeLineCount,
      hint: "multiple",
      reason:
        "The prompt contains separate transaction blocks, so each block is its own entry.",
      uniqueDateCount,
    };
  }

  if (completeLineCount >= 2 || uniqueDateCount >= 2) {
    return {
      amountLineCount,
      completeLineCount,
      hint: "multiple",
      reason:
        uniqueDateCount >= 2
          ? "The prompt contains more than one date, so each transaction is its own entry."
          : "The prompt repeats complete transaction lines, so each line is its own entry.",
      uniqueDateCount,
    };
  }

  if (amountLineCount <= 1) {
    return {
      amountLineCount,
      completeLineCount,
      hint: "single",
      reason: "The prompt describes a single amount, so it is one entry.",
      uniqueDateCount,
    };
  }

  if (uniqueDateCount <= 1 && completeLineCount <= 1) {
    return {
      amountLineCount,
      completeLineCount,
      hint: "compound",
      reason:
        "The prompt shares one vendor and one date across several amount lines, so it is one compound entry.",
      uniqueDateCount,
    };
  }

  return {
    amountLineCount,
    completeLineCount,
    hint: "unclear",
    reason: "The prompt structure is mixed; decide from the split-versus-compound rules.",
    uniqueDateCount,
  };
}
