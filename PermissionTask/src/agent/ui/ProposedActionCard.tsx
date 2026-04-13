import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import {
  confirmPendingCommand,
  cancelPendingCommand,
} from "@/src/agent/router";
import { useAppStore } from "@/src/store/useAppStore";

export function ProposedActionCard() {
  const pendingCommand = useAppStore((state) => state.pendingCommand);

  if (!pendingCommand) return null;

  const handleConfirm = async () => {
    await confirmPendingCommand();
  };

  const handleCancel = () => {
    cancelPendingCommand();
  };

  const commandLabel =
    {
      navigate: `Go to ${pendingCommand.payload?.screen}`,
      openFlyout: "Open agent",
      closeFlyout: "Close agent",
      applyExploreFilter: "Apply filter",
      setPreference: `Turn ${pendingCommand.payload?.value ? "on" : "off"} dark mode`,
      showAlert: "Show alert",
      exportAuditLog: "Export audit log to file",
    }[pendingCommand.type] || "Confirm action";

  return (
    <View style={styles.backdrop}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#10b981" />
          <Text style={styles.title}>Confirm Action</Text>
        </View>

        <Text style={styles.description}>{commandLabel}</Text>

        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
          >
            <Ionicons name="close-outline" size={18} color="#ef4444" />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.confirmButton]}
            onPress={handleConfirm}
          >
            <Ionicons name="checkmark-outline" size={18} color="#fff" />
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-start",
    paddingTop: 60,
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  container: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#10b981",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  cancelButton: {
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#dc2626",
  },
  confirmButton: {
    backgroundColor: "#10b981",
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
});
