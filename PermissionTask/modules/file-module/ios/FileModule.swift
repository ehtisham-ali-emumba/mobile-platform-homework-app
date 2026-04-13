import ExpoModulesCore
import Foundation

public class FileModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FileModule")

    func resolveLogFileURL(_ filePathOrName: String) -> URL {
      if filePathOrName.hasPrefix("/") {
        return URL(fileURLWithPath: filePathOrName)
      }

      let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
      return directory.appendingPathComponent(filePathOrName)
    }

    AsyncFunction("writeLog") { (contents: String, filename: String) -> String in
      let fileURL = resolveLogFileURL(filename)
      let timestamp = ISO8601DateFormatter().string(from: Date())
      let separator = "\n" + String(repeating: "-", count: 30) + "\n"
      let logEntry = "[\(timestamp)] \(contents)\(separator)"
      
      if FileManager.default.fileExists(atPath: fileURL.path) {
        if let fileHandle = FileHandle(forWritingAtPath: fileURL.path) {
          fileHandle.seekToEndOfFile()
          if let data = logEntry.data(using: .utf8) {
            fileHandle.write(data)
          }
          fileHandle.closeFile()
        }
      } else {
        try logEntry.write(to: fileURL, atomically: true, encoding: .utf8)
      }
      return fileURL.path
    }

    AsyncFunction("getLogPath") { (filename: String) -> String in
      resolveLogFileURL(filename).path
    }

    AsyncFunction("readLog") { (filePathOrName: String) -> String in
      let fileURL = resolveLogFileURL(filePathOrName)
      return try String(contentsOf: fileURL, encoding: .utf8)
    }

    AsyncFunction("clearLog") { (filename: String) -> Bool in
      let fileURL = resolveLogFileURL(filename)
      if FileManager.default.fileExists(atPath: fileURL.path) {
        try FileManager.default.removeItem(at: fileURL)
      }
      return true
    }
  }
}
