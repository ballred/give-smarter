import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("escapes spreadsheet formulas in string cells", () => {
    const csv = toCsv(["value"], [["=2+2"], ["+SUM(A1:A2)"], ["@cmd"], ["\t-10"]]);
    expect(csv).toContain("'=2+2");
    expect(csv).toContain("'+SUM(A1:A2)");
    expect(csv).toContain("'@cmd");
    expect(csv).toContain("'\t-10");
  });

  it("keeps numeric values as numeric text", () => {
    const csv = toCsv(["value"], [[-42], [100]]);
    expect(csv).toContain("-42");
    expect(csv).toContain("100");
    expect(csv).not.toContain("'-42");
  });
});
