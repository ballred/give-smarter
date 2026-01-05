const needsEscaping = /[",\n]/;

export function toCsv(headers: string[], rows: (string | number | null)[][]) {
  const lines = [headers.map(escapeCell).join(",")];

  for (const row of rows) {
    lines.push(row.map(escapeCell).join(","));
  }

  return lines.join("\n");
}

function escapeCell(value: string | number | null) {
  if (value === null || value === undefined) {
    return "";
  }

  const str = String(value);
  if (needsEscaping.test(str)) {
    return `"${str.replaceAll("\"", "\"\"")}"`;
  }

  return str;
}
