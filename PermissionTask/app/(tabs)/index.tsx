import { Image } from "expo-image";
import { useState } from "react";
import {
  Alert,
  Button,
  Platform,
  StyleSheet,
  ScrollView,
  Text,
} from "react-native";

import { HelloWave } from "@/components/hello-wave";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Link } from "expo-router";
import { readLog, writeLog, clearLog } from "@/modules/file-module";

export default function HomeScreen() {
  const [logPath, setLogPath] = useState<string | null>(null);
  const [logContents, setLogContents] = useState<string>("");

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit{" "}
          <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText>{" "}
          to see changes. Press{" "}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: "cmd + d",
              android: "cmd + m",
              web: "F12",
            })}
          </ThemedText>{" "}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction
              title="Action"
              icon="cube"
              onPress={() => alert("Action pressed")}
            />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert("Share pressed")}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert("Delete pressed")}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">
            npm run reset-project
          </ThemedText>{" "}
          to get a fresh <ThemedText type="defaultSemiBold">app</ThemedText>{" "}
          directory. This will move the current{" "}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{" "}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 4: Native Log Writer</ThemedText>
        <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
          Logs are appended with timestamps and separators.
        </ThemedText>

        <Button
          title="Write to log"
          onPress={async () => {
            try {
              const content = `Test log entry: ${Math.random().toString(36).substring(7)}`;
              const path = await writeLog(content, "smoke.txt");
              setLogPath(path);
              // Auto-read after write
              const contents = await readLog("smoke.txt");
              setLogContents(contents);
              Alert.alert("Log written ✓", path);
            } catch (error) {
              Alert.alert(
                "Write failed",
                error instanceof Error ? error.message : "Unknown error",
              );
            }
          }}
        />

        <Button
          title="Refresh log view"
          onPress={async () => {
            try {
              const contents = await readLog("smoke.txt");
              setLogContents(contents);
              Alert.alert("Log refreshed ✓");
            } catch (error) {
              Alert.alert(
                "Read failed",
                error instanceof Error ? error.message : "Unknown error",
              );
            }
          }}
        />

        <Button
          title="Clear log file (delete)"
          onPress={async () => {
            try {
              await clearLog("smoke.txt");
              setLogContents("");
              setLogPath(null);
              Alert.alert("Log file deleted ✓");
            } catch (error) {
              Alert.alert(
                "Clear failed",
                error instanceof Error ? error.message : "Unknown error",
              );
            }
          }}
        />

        {logPath && (
          <ThemedView style={styles.pathContainer}>
            <ThemedText style={{ fontSize: 11, opacity: 0.6 }}>
              📁 File: {logPath}
            </ThemedText>
          </ThemedView>
        )}

        {logContents ? (
          <ThemedView style={styles.logContainer}>
            <ThemedText type="subtitle" style={{ marginBottom: 8 }}>
              📋 Log Output:
            </ThemedText>
            <ScrollView style={styles.logScroll} nestedScrollEnabled={true}>
              <Text style={styles.logText}>{logContents}</Text>
            </ScrollView>
          </ThemedView>
        ) : (
          <ThemedText style={{ fontSize: 12, opacity: 0.5, marginTop: 8 }}>
            No logs yet. Click &quot;Write to log&quot; to create entries.
          </ThemedText>
        )}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  pathContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  logContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  logScroll: {
    maxHeight: 300,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 4,
    padding: 8,
  },
  logText: {
    fontFamily: Platform.select({ ios: "Courier", android: "monospace" }),
    fontSize: 11,
    lineHeight: 18,
    color: "#333",
  },
});
