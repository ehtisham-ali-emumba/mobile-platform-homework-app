import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  cancelPendingCommand,
  confirmPendingCommand,
  dispatch,
} from "@/src/agent/router";
import { useAppStore } from "@/src/store/useAppStore";

export default function HomeScreen() {
  const activityLog = useAppStore((state) => state.activityLog);
  const pendingCommand = useAppStore((state) => state.pendingCommand);

  const lastFive = useMemo(
    () => activityLog.slice(-5).reverse(),
    [activityLog],
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>Phase 5 agent flyout ready</Text>

      <View style={styles.buttonGroup}>
        <Pressable
          style={[styles.actionButton, styles.actionAgent]}
          onPress={() => dispatch({ type: "openFlyout", payload: {} })}
        >
          <Ionicons name="chatbubbles-outline" size={18} color="#fff" />
          <Text style={styles.actionText}>Open Agent Chat</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() =>
            dispatch({ type: "navigate", payload: { screen: "explore" } })
          }
        >
          <Ionicons name="navigate-outline" size={18} color="#fff" />
          <Text style={styles.actionText}>Navigate to Explore</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.actionWarn]}
          onPress={() => dispatch({ type: "nope" as never, payload: {} })}
        >
          <Ionicons name="alert-circle-outline" size={18} color="#fff" />
          <Text style={styles.actionText}>Dispatch Invalid Command</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() =>
            dispatch({
              type: "setPreference",
              payload: { key: "darkMode", value: true },
            })
          }
        >
          <Ionicons name="moon-outline" size={18} color="#fff" />
          <Text style={styles.actionText}>Enable Dark Mode (Confirm)</Text>
        </Pressable>
      </View>

      {pendingCommand && (
        <View style={styles.pendingCard}>
          <Text style={styles.pendingTitle}>Pending confirmation</Text>
          <Text style={styles.pendingText}>{pendingCommand.type}</Text>
          <View style={styles.pendingActions}>
            <Pressable
              style={styles.smallConfirm}
              onPress={() => confirmPendingCommand()}
            >
              <Text style={styles.smallButtonText}>Confirm</Text>
            </Pressable>
            <Pressable
              style={styles.smallCancel}
              onPress={() => cancelPendingCommand()}
            >
              <Text style={styles.smallButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Recent activity</Text>
      {lastFive.length === 0 ? (
        <Text style={styles.emptyText}>No activity yet.</Text>
      ) : (
        lastFive.map((entry) => (
          <View key={entry.id} style={styles.logRow}>
            <View style={styles.logHeader}>
              <Text style={styles.logPrimary}>{entry.commandType}</Text>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>{entry.status}</Text>
              </View>
            </View>
            {entry.reason ? (
              <Text style={styles.logSecondary}>{entry.reason}</Text>
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  sectionTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  buttonGroup: {
    gap: 8,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#0284c7",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionAgent: {
    backgroundColor: "#7c3aed",
  },
  actionWarn: {
    backgroundColor: "#dc2626",
  },
  actionText: {
    color: "#fff",
    fontWeight: "600",
  },
  pendingCard: {
    borderWidth: 1,
    borderColor: "#f59e0b",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    backgroundColor: "#fffbeb",
  },
  pendingTitle: {
    fontWeight: "700",
  },
  pendingText: {
    fontSize: 13,
  },
  pendingActions: {
    flexDirection: "row",
    gap: 8,
  },
  smallConfirm: {
    backgroundColor: "#16a34a",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  smallCancel: {
    backgroundColor: "#475569",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  smallButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyText: {
    opacity: 0.7,
  },
  logRow: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#f8fafc",
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logPrimary: {
    fontWeight: "600",
  },
  logSecondary: {
    marginTop: 2,
    opacity: 0.7,
  },
  statusPill: {
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});
