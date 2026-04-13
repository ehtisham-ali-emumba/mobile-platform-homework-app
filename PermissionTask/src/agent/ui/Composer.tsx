import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { dispatch } from "@/src/agent/router";
import { parseInput } from "@/src/agent/parser";
import { useAppStore } from "@/src/store/useAppStore";

interface ComposerProps {
  onMessageSent?: () => void;
}

export function Composer({ onMessageSent }: ComposerProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 18);
  const prefilledPrompt = useAppStore(
    (state) => state.flyoutState.prefilledPrompt,
  );

  const handleSend = async () => {
    let text = input || prefilledPrompt;
    if (!text?.trim()) return;

    setHint(null);
    setIsLoading(true);
    try {
      const parsed = parseInput(text);
      if (parsed.command) {
        await dispatch(parsed.command);
        setInput("");
        onMessageSent?.();
      } else {
        setHint(parsed.helpText ?? "Command not recognized.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const displayText = input || prefilledPrompt || "";

  return (
    <View style={[styles.container, { paddingBottom: bottomPad }]}>
      {hint ? <Text style={styles.hintText}>{hint}</Text> : null}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a command..."
          placeholderTextColor="#94a3b8"
          value={displayText}
          onChangeText={(v) => {
            setInput(v);
            if (hint) setHint(null);
          }}
          editable={!isLoading}
          multiline
        />
        <Pressable
          style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={isLoading || !displayText.trim()}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size={18} />
          ) : (
            <Ionicons name="send-outline" size={18} color="#fff" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopColor: "#e2e8f0",
    borderTopWidth: 1,
    backgroundColor: "#fff",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 0,
    color: "#1e293b",
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 0,
  },
  sendButtonDisabled: {
    backgroundColor: "#cbd5e1",
  },
  hintText: {
    fontSize: 12,
    color: "#ef4444",
    marginBottom: 6,
    paddingHorizontal: 4,
  },
});
