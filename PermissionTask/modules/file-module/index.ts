import FileModule from "./src/FileModule";

export async function writeLog(
  contents: string,
  filename: string,
): Promise<string> {
  return FileModule.writeLog(contents, filename);
}

export async function getLogPath(filename: string): Promise<string> {
  return FileModule.getLogPath(filename);
}

export async function readLog(filePathOrName: string): Promise<string> {
  return FileModule.readLog(filePathOrName);
}

export async function clearLog(filename: string): Promise<boolean> {
  return FileModule.clearLog(filename);
}

export default FileModule;
