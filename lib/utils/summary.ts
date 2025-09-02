// utils/summary.ts
export function coerceSummary(content: unknown): any {
  const tryParse = (s: string) => { try { return JSON.parse(s) } catch { return null } };

  const scrub = (s: string) =>
    s
      .replace(/^```json/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .replace(/^\s*json\b/i, "")
      .trim();

  const extractFirstJson = (s: string) => {
    const cleaned = scrub(s);
    const m = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/); // first {...} or [...]
    return m ? tryParse(m[0]) : null;
  };

  const drill = (v: any): any => {
    if (v == null) return { summary: "" };
    if (typeof v === "string") return tryParse(v) ?? extractFirstJson(v) ?? { summary: v };
    if (typeof v === "object") {
      // Common backend shapes
      if (typeof v.summary === "string") return drill(v.summary);
      if (v.summary && typeof v.summary.summary === "string") return drill(v.summary.summary);
      return v; // already structured JSON
    }
    return { summary: String(v) };
  };

  return drill(content);
} 