export type CommandPayloadMap = {
  navigate: { screen: "home" | "explore" | "profile" };
  openFlyout: { prefilledPrompt?: string };
  closeFlyout: Record<string, never>;
  applyExploreFilter: { filter: string; sort?: "asc" | "desc" };
  setPreference: { key: "darkMode"; value: boolean };
  showAlert: { title: string; message: string };
  exportAuditLog: Record<string, never>;
};

export type CommandType = keyof CommandPayloadMap;

export type Command<T extends CommandType = CommandType> = {
  type: T;
  payload: CommandPayloadMap[T];
};

export type ActivityStatus = "executed" | "rejected" | "pending" | "cancelled";

export type ActivityEntry = {
  id: string;
  timestamp: string;
  commandType: string;
  status: ActivityStatus;
  reason?: string;
  payload?: unknown;
};

export type DispatchResult = {
  status: "executed" | "rejected" | "pending";
  reason?: string;
  data?: unknown;
};
