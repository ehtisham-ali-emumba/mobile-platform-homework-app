import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Switch } from "react-native-switchery";
import { Ionicons } from "@expo/vector-icons";

import { dispatch } from "@/src/agent/router";
import { useAppStore } from "@/src/store/useAppStore";

export default function ProfileScreen() {
  const darkMode = useAppStore((state) => state.preferences.darkMode);
  const activityLog = useAppStore((state) => state.activityLog);

  const items = useMemo(() => activityLog.slice().reverse(), [activityLog]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.preferenceRow}>
        <Text style={styles.preferenceLabel}>Dark mode</Text>
        <Switch
          value={darkMode}
          size="small"
          variant="info"
          onValueChange={(value) =>
            dispatch({
              type: "setPreference",
              payload: { key: "darkMode", value },
            })
          }
        />
      </View>

      <Pressable
        style={styles.exportButton}
        onPress={() => dispatch({ type: "exportAuditLog", payload: {} })}
      >
        <Ionicons name="download-outline" size={18} color="#fff" />
        <Text style={styles.exportText}>Export Audit Log (Confirm)</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Activity log</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No activity yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowTop}>
              <Text style={styles.rowPrimary}>
                {new Date(item.timestamp).toLocaleTimeString()} -{" "}
                {item.commandType}
              </Text>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            {item.reason ? (
              <Text style={styles.rowSecondary}>{item.reason}</Text>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  sectionTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "700",
  },
  exportButton: {
    backgroundColor: "#0369a1",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  exportText: {
    color: "#fff",
    fontWeight: "600",
  },
  preferenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#f8fafc",
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  row: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  rowPrimary: {
    fontWeight: "600",
    flexShrink: 1,
  },
  rowSecondary: {
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
  empty: {
    opacity: 0.7,
  },
});
