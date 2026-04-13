import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAppStore } from "@/src/store/useAppStore";

const filters = ["all", "news", "tasks", "alerts"];

export default function ExploreScreen() {
  const exploreFilter = useAppStore((state) => state.exploreFilter);
  const setExploreFilter = useAppStore((state) => state.setExploreFilter);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explore</Text>
      <Text style={styles.subtitle}>Filter and sort controls</Text>

      <Text style={styles.blockLabel}>Category</Text>
      <View style={styles.row}>
        {filters.map((filter) => {
          const selected = exploreFilter.filter === filter;
          return (
            <Pressable
              key={filter}
              onPress={() => setExploreFilter({ filter })}
              style={[styles.pill, selected && styles.selectedPill]}
            >
              <Text
                style={[styles.pillText, selected && styles.selectedPillText]}
              >
                {filter}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.blockLabel}>Sort order</Text>
      <View style={styles.row}>
        <Pressable
          style={[
            styles.sortButton,
            exploreFilter.sort === "asc" && styles.selectedPill,
          ]}
          onPress={() => setExploreFilter({ sort: "asc" })}
        >
          <Text style={styles.pillText}>Sort: ASC</Text>
        </Pressable>
        <Pressable
          style={[
            styles.sortButton,
            exploreFilter.sort === "desc" && styles.selectedPill,
          ]}
          onPress={() => setExploreFilter({ sort: "desc" })}
        >
          <Text style={styles.pillText}>Sort: DESC</Text>
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.valueText}>
          Active filter: {exploreFilter.filter} ({exploreFilter.sort})
        </Text>
      </View>
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
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  blockLabel: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  pill: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  selectedPill: {
    borderColor: "#0369a1",
    backgroundColor: "#e0f2fe",
  },
  pillText: {
    textTransform: "capitalize",
    fontWeight: "500",
  },
  selectedPillText: {
    fontWeight: "600",
    color: "#0c4a6e",
  },
  sortButton: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  summaryCard: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#f8fafc",
  },
  valueText: {
    fontSize: 14,
    color: "#334155",
  },
});
