import { NativeModule, requireNativeModule } from "expo";

declare class FileModule extends NativeModule {
  writeLog(contents: string, filename: string): Promise<string>;
  getLogPath(filename: string): Promise<string>;
  readLog(filePathOrName: string): Promise<string>;
  clearLog(filename: string): Promise<boolean>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<FileModule>("FileModule");
