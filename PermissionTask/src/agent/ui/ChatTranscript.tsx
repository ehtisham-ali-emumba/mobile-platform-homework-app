import { useState, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetFlatList,
  useBottomSheetInternal,
} from "@gorhom/bottom-sheet";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppStore } from "@/src/store/useAppStore";
import type { ActivityEntry } from "@/src/agent/types";

// Composer baseline: container paddingVertical 12*2 + inputRow (sendButton 36) = ~60px
const COMPOSER_BASE_HEIGHT = 60;

interface ChatMessage {
  id: string;
  type: "user" | "agent";
  text: string;
  timestamp: string;
  status?: string;
}

interface ChatTranscriptProps {
  topContent?: ReactNode;
}

export function ChatTranscript({ topContent }: ChatTranscriptProps) {
  const activityLog = useAppStore((state) => state.activityLog);
  const insets = useSafeAreaInsets();
  const { animatedLayoutState } = useBottomSheetInternal();
  const [footerHeight, setFooterHeight] = useState(0);

  useAnimatedReaction(
    () => animatedLayoutState.get().footerHeight,
    (next, prev) => {
      if (next !== prev) {
        runOnJS(setFooterHeight)(next);
      }
    },
    [animatedLayoutState],
  );

  // Floor: never less than the known Composer height + safe area, so latest
  // items are visible on first render before the reactive measurement lands.
  const composerEstimate = COMPOSER_BASE_HEIGHT + Math.max(insets.bottom, 12);
  const bottomClearance = Math.max(footerHeight, composerEstimate) + 12;

  const messages: ChatMessage[] = activityLog
    .map((entry: ActivityEntry) => ({
      id: entry.id,
      type: "agent" as const,
      text: formatEntryText(entry),
      timestamp: new Date(entry.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: entry.status,
    }))
    .reverse();

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isSuccess = item.status === "executed";
    const isRejected = item.status === "rejected";
    const isPending = item.status === "pending";

    return (
      <View
        style={[styles.messageRow, item.type === "user" && styles.userMessage]}
      >
        <View
          style={[
            styles.messageBubble,
            item.type === "user" && styles.userBubble,
            isSuccess && styles.successBubble,
            isRejected && styles.rejectedBubble,
            isPending && styles.pendingBubble,
          ]}
        >
          <View style={styles.messageHeader}>
            <Text
              style={[
                styles.messageText,
                item.type === "user" && styles.userText,
              ]}
            >
              {item.text}
            </Text>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
          </View>
          {isRejected && item.status && (
            <Text style={styles.reasonText}>Rejected</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <BottomSheetFlatList
      data={messages}
      renderItem={renderMessage}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[
        styles.container,
        { paddingTop: bottomClearance },
      ]}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={32} color="#cbd5e1" />
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>Try &quot;go to explore&quot;</Text>
        </View>
      }
      ListFooterComponent={topContent ? <>{topContent}</> : null}
      inverted
    />
  );
}

function formatEntryText(entry: ActivityEntry): string {
  const typeLabel =
    {
      navigate: "Navigate",
      openFlyout: "Open flyout",
      closeFlyout: "Close flyout",
      applyExploreFilter: "Apply filter",
      setPreference: "Set preference",
      showAlert: "Show alert",
      exportAuditLog: "Export log",
    }[entry.commandType] || entry.commandType;

  return `${typeLabel} — ${entry.status}`;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  messageRow: {
    marginVertical: 6,
    justifyContent: "flex-start",
  },
  userMessage: {
    justifyContent: "flex-end",
  },
  messageBubble: {
    maxWidth: "80%",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  userBubble: {
    backgroundColor: "#3b82f6",
    alignSelf: "flex-end",
  },
  successBubble: {
    backgroundColor: "#ecfdf5",
    borderLeftWidth: 3,
    borderLeftColor: "#10b981",
  },
  rejectedBubble: {
    backgroundColor: "#fef2f2",
    borderLeftWidth: 3,
    borderLeftColor: "#ef4444",
  },
  pendingBubble: {
    backgroundColor: "#fffbeb",
    borderLeftWidth: 3,
    borderLeftColor: "#f59e0b",
  },
  messageHeader: {
    gap: 4,
  },
  messageText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "500",
  },
  userText: {
    color: "#fff",
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  reasonText: {
    fontSize: 11,
    color: "#dc2626",
    marginTop: 4,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },
});
