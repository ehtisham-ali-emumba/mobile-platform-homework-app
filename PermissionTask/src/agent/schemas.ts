import { z } from "zod";

import type { CommandType } from "@/src/agent/types";

export const commandSchemas = {
  navigate: z.object({ screen: z.enum(["home", "explore", "profile"]) }),
  openFlyout: z.object({ prefilledPrompt: z.string().optional() }),
  closeFlyout: z.object({}),
  applyExploreFilter: z.object({
    filter: z.string().min(1),
    sort: z.enum(["asc", "desc"]).optional(),
  }),
  setPreference: z.object({
    key: z.literal("darkMode"),
    value: z.boolean(),
  }),
  showAlert: z.object({
    title: z.string().min(1),
    message: z.string().min(1),
  }),
  exportAuditLog: z.object({}),
} satisfies Record<CommandType, z.ZodTypeAny>;
