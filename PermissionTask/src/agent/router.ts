import { router } from "expo-router";
import { Alert } from "react-native";

import { commandSchemas } from "@/src/agent/schemas";
import type {
  ActivityEntry,
  Command,
  CommandType,
  DispatchResult,
} from "@/src/agent/types";
import { useAppStore } from "@/src/store/useAppStore";
import { writeLog } from "@/modules/file-module";

const ALLOWED_TYPES = new Set<CommandType>([
  "navigate",
  "openFlyout",
  "closeFlyout",
  "applyExploreFilter",
  "setPreference",
  "showAlert",
  "exportAuditLog",
]);

const NEEDS_CONFIRM = new Set<CommandType>(["setPreference", "exportAuditLog"]);

const screenRouteMap: Record<
  "home" | "explore" | "profile",
  "/(tabs)" | "/(tabs)/explore" | "/(tabs)/profile"
> = {
  home: "/(tabs)",
  explore: "/(tabs)/explore",
  profile: "/(tabs)/profile",
};

function logEntry(
  entry: Omit<ActivityEntry, "id" | "timestamp">,
): ActivityEntry {
  const next: ActivityEntry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  useAppStore.getState().addActivityLog(next);
  return next;
}

function reject(
  command: Command | { type: string; payload?: unknown },
  reason: string,
): DispatchResult {
  logEntry({
    commandType: command.type,
    status: "rejected",
    reason,
    payload: command.payload,
  });
  return { status: "rejected", reason };
}

async function executeAndLog(command: Command): Promise<DispatchResult> {
  switch (command.type) {
    case "navigate": {
      router.navigate(screenRouteMap[command.payload.screen]);
      break;
    }
    case "openFlyout": {
      useAppStore.getState().setFlyoutState({ open: true, ...command.payload });
      break;
    }
    case "closeFlyout": {
      useAppStore.getState().setFlyoutState({ open: false });
      break;
    }
    case "applyExploreFilter": {
      useAppStore.getState().setExploreFilter({
        filter: command.payload.filter,
        sort: command.payload.sort,
      });
      break;
    }
    case "setPreference": {
      useAppStore
        .getState()
        .setPreference(command.payload.key, command.payload.value);
      break;
    }
    case "showAlert": {
      Alert.alert(command.payload.title, command.payload.message);
      break;
    }
    case "exportAuditLog": {
      const activityLog = useAppStore.getState().activityLog;
      const contents = JSON.stringify(activityLog, null, 2);
      const path = await writeLog(contents, `audit-${Date.now()}.json`);
      Alert.alert("Audit log exported", path);
      break;
    }
    default:
      return reject(command, "unhandled-command");
  }

  logEntry({
    commandType: command.type,
    status: "executed",
    payload: command.payload,
  });
  return { status: "executed" };
}

export async function dispatch(command: Command): Promise<DispatchResult> {
  if (!ALLOWED_TYPES.has(command.type)) {
    return reject(command, "not-in-allowlist");
  }

  const parsed = commandSchemas[command.type].safeParse(command.payload);
  if (!parsed.success) {
    return reject(command, "schema-fail");
  }

  if (NEEDS_CONFIRM.has(command.type)) {
    useAppStore.getState().setPendingCommand(command);
    logEntry({
      commandType: command.type,
      status: "pending",
      payload: command.payload,
    });
    return { status: "pending" };
  }

  return executeAndLog({ ...command, payload: parsed.data } as Command);
}

export async function confirmPendingCommand(): Promise<DispatchResult> {
  const pending = useAppStore.getState().pendingCommand;
  if (!pending) {
    return { status: "rejected", reason: "no-pending-command" };
  }
  useAppStore.getState().setPendingCommand(null);
  return executeAndLog(pending);
}

export function cancelPendingCommand(): DispatchResult {
  const pending = useAppStore.getState().pendingCommand;
  if (!pending) {
    return { status: "rejected", reason: "no-pending-command" };
  }
  useAppStore.getState().setPendingCommand(null);
  logEntry({
    commandType: pending.type,
    status: "cancelled",
    reason: "user-cancelled",
    payload: pending.payload,
  });
  return { status: "rejected", reason: "user-cancelled" };
}
