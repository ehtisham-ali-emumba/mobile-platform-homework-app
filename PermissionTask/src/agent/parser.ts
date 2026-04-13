import type { Command } from "@/src/agent/types";

type ParseResult = {
  command: Command | null;
  confidence: number;
  needsConfirm: boolean;
  helpText?: string;
};

export function parseInput(input: string): ParseResult {
  const text = input.trim().toLowerCase();

  if (/go to (home|explore|profile)/i.test(text)) {
    const screen = text.includes("explore")
      ? "explore"
      : text.includes("profile")
        ? "profile"
        : "home";
    return {
      command: { type: "navigate", payload: { screen } },
      confidence: 0.95,
      needsConfirm: false,
    };
  }

  if (/open (the )?agent|open flyout/i.test(text)) {
    return {
      command: { type: "openFlyout", payload: {} },
      confidence: 0.9,
      needsConfirm: false,
    };
  }

  if (/close (the )?agent|close flyout/i.test(text)) {
    return {
      command: { type: "closeFlyout", payload: {} },
      confidence: 0.9,
      needsConfirm: false,
    };
  }

  if (/(dark|light) mode/i.test(text)) {
    const value = /dark/i.test(text);
    return {
      command: { type: "setPreference", payload: { key: "darkMode", value } },
      confidence: 0.9,
      needsConfirm: true,
    };
  }

  if (/export (the )?(audit )?log/i.test(text)) {
    return {
      command: { type: "exportAuditLog", payload: {} },
      confidence: 0.9,
      needsConfirm: true,
    };
  }

  // applyExploreFilter — sort-only, filter-only, or combined
  const sortMatch = text.match(
    /sort (by )?(asc(?:ending)?|desc(?:ending)?|newest|oldest)/i,
  );
  const filterMatch = text.match(
    /(?:filter|show|search)(?: by| for| me)?\s+([a-z0-9 _-]+?)(?:\s+(?:asc|desc|ascending|descending|newest|oldest))?$/i,
  );
  const applyExplicit = text.match(
    /apply (?:explore )?filter\s+([a-z0-9 _-]+)/i,
  );

  if (sortMatch || filterMatch || applyExplicit) {
    let sort: "asc" | "desc" | undefined;
    if (sortMatch) {
      const raw = sortMatch[2].toLowerCase();
      sort = raw === "asc" || raw === "ascending" ? "asc" : "desc";
      if (raw === "newest") sort = "desc";
      if (raw === "oldest") sort = "asc";
    }

    const rawFilter = (applyExplicit?.[1] ?? filterMatch?.[1] ?? "").trim();
    const filter = rawFilter || (sort ? "all" : "");

    if (filter || sort) {
      const payload: { filter: string; sort?: "asc" | "desc" } = {
        filter: filter || "all",
      };
      if (sort) payload.sort = sort;
      return {
        command: { type: "applyExploreFilter", payload },
        confidence: 0.85,
        needsConfirm: false,
      };
    }
  }

  return {
    command: null,
    confidence: 0,
    needsConfirm: false,
    helpText:
      'Try: "go to explore", "dark mode on", "filter by design", "sort by newest", "export audit log".',
  };
}
