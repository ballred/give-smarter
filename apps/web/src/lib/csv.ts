const needsEscaping = /[",\n]/;
const formulaPrefix = /^[\t ]*[=+\-@]/;

export type ParsedCsv = {
  headers: string[];
  rows: string[][];
};

export function toCsv(headers: string[], rows: (string | number | null)[][]) {
  const lines = [headers.map(escapeCell).join(",")];

  for (const row of rows) {
    lines.push(row.map(escapeCell).join(","));
  }

  return lines.join("\n");
}

export function parseCsv(input: string): ParsedCsv {
  const rows: string[][] = [];
  let current: string[] = [];
  let value = "";
  let inQuotes = false;

  const pushValue = () => {
    current.push(value);
    value = "";
  };

  const pushRow = () => {
    if (current.length || value.length) {
      pushValue();
      rows.push(current);
      current = [];
    }
  };

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        value += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && (char === "," || char === "\n" || char === "\r")) {
      if (char === "," ) {
        pushValue();
      } else {
        pushRow();
      }

      if (char === "\r" && next === "\n") {
        i += 1;
      }
      continue;
    }

    value += char;
  }

  if (value.length || current.length) {
    pushRow();
  }

  const [headers, ...data] = rows;
  const normalizedHeaders =
    headers?.map((header) => header.trim()) ?? [];

  return { headers: normalizedHeaders, rows: data };
}

function escapeCell(value: string | number | null) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }

  const str = String(value);
  const safe = formulaPrefix.test(str) ? `'${str}` : str;

  if (needsEscaping.test(safe)) {
    return `"${safe.replaceAll("\"", "\"\"")}"`;
  }

  return safe;
}
