import { useCallback, useMemo } from "react";
import { StyleSheet } from "react-native";
import BottomSheet, {
  BottomSheetFooter,
  type BottomSheetFooterProps,
} from "@gorhom/bottom-sheet";

import { useAppStore } from "@/src/store/useAppStore";
import { ChatTranscript } from "./ChatTranscript";
import { Composer } from "./Composer";
import { ProposedActionCard } from "./ProposedActionCard";

export function AgentFlyout() {
  const snapPoints = useMemo(() => ["50%", "80%"], []);
  const open = useAppStore((state) => state.flyoutState.open);
  const pendingCommand = useAppStore((state) => state.pendingCommand);

  const handleSnap = (index: number) => {
    if (index < 0 && open) {
      useAppStore.getState().setFlyoutState({ open: false });
    }
  };

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={0}>
        <Composer />
      </BottomSheetFooter>
    ),
    [],
  );

  return (
    <BottomSheet
      index={open ? 1 : -1}
      snapPoints={snapPoints}
      onChange={handleSnap}
      enablePanDownToClose
      animateOnMount
      enableDynamicSizing={false}
      footerComponent={renderFooter}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
      style={styles.bottomSheet}
      enableContentPanningGesture={false}
    >
      <ChatTranscript
        topContent={pendingCommand ? <ProposedActionCard /> : null}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheet: {
    zIndex: 999,
  },
  background: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  handle: {
    backgroundColor: "#cbd5e1",
    width: 40,
    height: 4,
  },
});
