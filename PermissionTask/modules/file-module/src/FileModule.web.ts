import { registerWebModule, NativeModule } from "expo";

class FileModule extends NativeModule {
  async writeLog(): Promise<string> {
    throw new Error(
      "writeLog is only available on iOS and Android development builds.",
    );
  }

  async getLogPath(): Promise<string> {
    throw new Error(
      "getLogPath is only available on iOS and Android development builds.",
    );
  }

  async readLog(): Promise<string> {
    throw new Error(
      "readLog is only available on iOS and Android development builds.",
    );
  }

  async clearLog(): Promise<boolean> {
    throw new Error(
      "clearLog is only available on iOS and Android development builds.",
    );
  }
}

export default registerWebModule(FileModule, "FileModule");
