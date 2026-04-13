package expo.modules.filemodule

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class FileModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FileModule")

    fun resolveLogFile(filePathOrName: String): File {
      return if (filePathOrName.startsWith("/")) {
        File(filePathOrName)
      } else {
        val reactContext = appContext.reactContext ?: throw Exception("No React context")
        File(reactContext.filesDir, filePathOrName)
      }
    }

    AsyncFunction("writeLog") { contents: String, filename: String ->
      val file = resolveLogFile(filename)
      val timestamp = java.time.Instant.now().toString()
      val separator = "\n" + "-".repeat(30) + "\n"
      val logEntry = "[$timestamp] $contents$separator"
      
      if (file.exists()) {
        file.appendText(logEntry, Charsets.UTF_8)
      } else {
        file.writeText(logEntry, Charsets.UTF_8)
      }
      file.absolutePath
    }

    AsyncFunction("getLogPath") { filename: String ->
      resolveLogFile(filename).absolutePath
    }

    AsyncFunction("readLog") { filePathOrName: String ->
      val file = resolveLogFile(filePathOrName)
      file.readText(Charsets.UTF_8)
    }

    AsyncFunction("clearLog") { filename: String ->
      val file = resolveLogFile(filename)
      if (file.exists()) {
        file.delete()
      }
      true
    }
  }
}
