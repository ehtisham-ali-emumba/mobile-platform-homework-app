import { parseInput } from "@/src/agent/parser";

describe("parseInput", () => {
  // Navigation
  describe("navigate command", () => {
    it.each([
      ["go to home", "home"],
      ["go to explore", "explore"],
      ["go to profile", "profile"],
      ["Go To Profile", "profile"], // case-insensitive
    ])('"%s" → navigates to %s', (input, expectedScreen) => {
      const result = parseInput(input);
      expect(result.command).toEqual({
        type: "navigate",
        payload: { screen: expectedScreen },
      });
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.needsConfirm).toBe(false);
    });
  });

  // Dark / light mode
  describe("setPreference command", () => {
    it("enables dark mode", () => {
      const result = parseInput("dark mode");
      expect(result.command).toEqual({
        type: "setPreference",
        payload: { key: "darkMode", value: true },
      });
      expect(result.needsConfirm).toBe(true);
    });

    it("enables light mode", () => {
      const result = parseInput("light mode");
      expect(result.command).toEqual({
        type: "setPreference",
        payload: { key: "darkMode", value: false },
      });
      expect(result.needsConfirm).toBe(true);
    });
  });

  // Flyout open / close
  describe("flyout commands", () => {
    it("opens the agent flyout", () => {
      const result = parseInput("open the agent");
      expect(result.command?.type).toBe("openFlyout");
      expect(result.needsConfirm).toBe(false);
    });

    it("closes the agent flyout", () => {
      const result = parseInput("close flyout");
      expect(result.command?.type).toBe("closeFlyout");
      expect(result.needsConfirm).toBe(false);
    });
  });

  // Export audit log
  describe("exportAuditLog command", () => {
    it("triggers audit log export with confirmation", () => {
      const result = parseInput("export the audit log");
      expect(result.command).toEqual({
        type: "exportAuditLog",
        payload: {},
      });
      expect(result.needsConfirm).toBe(true);
    });
  });

  // Explore filters
  describe("applyExploreFilter command", () => {
    it("sorts ascending", () => {
      const result = parseInput("sort by asc");
      expect(result.command?.type).toBe("applyExploreFilter");
      expect((result.command?.payload as { sort: string }).sort).toBe("asc");
    });

    it("sorts descending with 'newest'", () => {
      const result = parseInput("sort by newest");
      expect((result.command?.payload as { sort: string }).sort).toBe("desc");
    });

    it("filters by keyword", () => {
      const result = parseInput("filter by design");
      expect(result.command?.type).toBe("applyExploreFilter");
      expect((result.command?.payload as { filter: string }).filter).toBe(
        "design",
      );
    });

    it("applies explicit filter label", () => {
      const result = parseInput("apply explore filter typography");
      expect((result.command?.payload as { filter: string }).filter).toBe(
        "typography",
      );
    });
  });

  // Unrecognised input
  describe("unknown input", () => {
    it("returns null command with help text for gibberish", () => {
      const result = parseInput("blah blah blah");
      expect(result.command).toBeNull();
      expect(result.confidence).toBe(0);
      expect(result.helpText).toBeTruthy();
    });

    it("handles empty string gracefully", () => {
      const result = parseInput("   ");
      expect(result.command).toBeNull();
    });
  });
});
