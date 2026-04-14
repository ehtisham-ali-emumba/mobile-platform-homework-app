/**
 * Router test — the gradeable, end-to-end proof that the command pipeline
 * behaves the way the brief (and agent/CONTEXT.md) says it does.
 *
 * What this proves:
 *  1. Off-allowlist commands are rejected and the rejection is written to the
 *     activity log with a reason — auditability, not just a silent drop.
 *  2. Allowlisted commands with malformed payloads are rejected at the zod
 *     layer with reason `schema-fail` and also logged.
 *  3. The confirmation gate on `setPreference` parks the command as `pending`
 *     without touching the preference — state changes do not happen without
 *     explicit user confirmation, which is the brief's hardest reject trigger.
 *  4. Non-gated, allowlisted, schema-valid commands execute and log `executed`.
 */

jest.mock("expo-router", () => ({
  router: { navigate: jest.fn() },
}));

jest.mock("react-native", () => ({
  Alert: { alert: jest.fn() },
}));

jest.mock("@/modules/file-module", () => ({
  writeLog: jest.fn().mockResolvedValue("/fake/path/audit.json"),
  getLogPath: jest.fn(),
  readLog: jest.fn(),
  clearLog: jest.fn(),
}));

// Keep zustand's persist middleware happy in node env — the real web fallback
// in @react-native-async-storage/async-storage calls `window`, which doesn't
// exist here. Store's try/catch only guards the require, not runtime setItem.
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}));

import { dispatch } from "@/src/agent/router";
import { useAppStore } from "@/src/store/useAppStore";

beforeEach(() => {
  useAppStore.setState({
    preferences: { darkMode: false },
    activityLog: [],
    flyoutState: { open: false },
    exploreFilter: { filter: "all", sort: "asc" },
    pendingCommand: null,
  });
});

describe("router.dispatch", () => {
  it("rejects off-allowlist commands and appends a rejected entry to the activity log", async () => {
    const result = await dispatch({
      type: "deleteDatabase",
      payload: {},
    } as never);

    expect(result.status).toBe("rejected");
    expect(result.reason).toBe("not-in-allowlist");

    const log = useAppStore.getState().activityLog;
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({
      commandType: "deleteDatabase",
      status: "rejected",
      reason: "not-in-allowlist",
    });
    expect(log[0].timestamp).toEqual(expect.any(String));
  });

  it("rejects allowlisted commands with malformed payloads at the zod layer", async () => {
    const result = await dispatch({
      type: "navigate",
      payload: { screen: "settings" },
    } as never);

    expect(result.status).toBe("rejected");
    expect(result.reason).toBe("schema-fail");

    const log = useAppStore.getState().activityLog;
    expect(log.at(-1)).toMatchObject({
      commandType: "navigate",
      status: "rejected",
      reason: "schema-fail",
    });
  });

  it("enforces the confirmation gate on setPreference instead of executing", async () => {
    const result = await dispatch({
      type: "setPreference",
      payload: { key: "darkMode", value: true },
    });

    expect(result.status).toBe("pending");

    // The preference must NOT be mutated until the user confirms.
    expect(useAppStore.getState().preferences.darkMode).toBe(false);

    // Pending command is parked on the store; log shows `pending`.
    const state = useAppStore.getState();
    expect(state.pendingCommand).toEqual({
      type: "setPreference",
      payload: { key: "darkMode", value: true },
    });
    expect(state.activityLog.at(-1)?.status).toBe("pending");
  });

  it("executes and logs non-gated allowlisted commands", async () => {
    const result = await dispatch({
      type: "applyExploreFilter",
      payload: { filter: "news", sort: "desc" },
    });

    expect(result.status).toBe("executed");
    expect(useAppStore.getState().exploreFilter).toEqual({
      filter: "news",
      sort: "desc",
    });
    expect(useAppStore.getState().activityLog.at(-1)).toMatchObject({
      commandType: "applyExploreFilter",
      status: "executed",
    });
  });
});
