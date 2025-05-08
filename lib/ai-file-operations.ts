import type { FileOperationsService } from "./file-operations"

// This service handles AI-specific file operations
export class AIFileOperationsService {
  private fileOperations: FileOperationsService

  constructor(fileOperations: FileOperationsService) {
    this.fileOperations = fileOperations
  }

  // Parse AI message to detect file operation intents
  async processMessage(
    message: string,
    currentFile: string,
    currentDirectory = "/",
  ): Promise<{
    response: string
    operationPerformed: boolean
  }> {
    message = message.toLowerCase()

    // Check for create file intent
    if (message.includes("create file") || message.includes("new file") || message.includes("make a file")) {
      return await this.handleCreateFile(message, currentDirectory)
    }

    // Check for update file intent
    if (
      (message.includes("update") || message.includes("modify") || message.includes("change")) &&
      (message.includes("file") || message.includes("code"))
    ) {
      return await this.handleUpdateFile(message, currentFile)
    }

    // Check for delete file intent
    if (message.includes("delete file") || message.includes("remove file")) {
      return await this.handleDeleteFile(message)
    }

    // Check for create directory intent
    if (
      message.includes("create directory") ||
      message.includes("create folder") ||
      message.includes("new directory") ||
      message.includes("new folder")
    ) {
      return await this.handleCreateDirectory(message, currentDirectory)
    }

    // No file operation detected
    return {
      response: "",
      operationPerformed: false,
    }
  }

  // Handle create file intent
  private async handleCreateFile(
    message: string,
    currentDirectory: string,
  ): Promise<{
    response: string
    operationPerformed: boolean
  }> {
    // Extract filename
    const filenameMatch = message.match(
      /(?:create|new|make)(?:\s+a)?\s+file(?:\s+called|\s+named)?\s+["']?([a-zA-Z0-9_.-]+)["']?/i,
    )
    if (!filenameMatch) {
      return {
        response: "I'd like to create a file for you, but I need a filename. Can you specify what to name the file?",
        operationPerformed: false,
      }
    }

    const filename = filenameMatch[1]

    // Extract content
    let content = ""
    const contentMatch = message.match(/with(?:\s+the)?\s+content(?:\s+of)?:?\s+([\s\S]*)/i)
    if (contentMatch) {
      content = contentMatch[1].trim()
      // Remove code block markers if present
      content = content.replace(/^```[\w]*\n|```$/gm, "")
    }

    // Create the file
    const success = await this.fileOperations.createFile(currentDirectory, filename, content)

    if (success) {
      return {
        response: `I've created the file "${filename}" for you.`,
        operationPerformed: true,
      }
    } else {
      return {
        response: `I couldn't create the file "${filename}". Please check if the file already exists or if you have the necessary permissions.`,
        operationPerformed: false,
      }
    }
  }

  // Handle update file intent
  private async handleUpdateFile(
    message: string,
    currentFile: string,
  ): Promise<{
    response: string
    operationPerformed: boolean
  }> {
    if (!currentFile) {
      return {
        response: "I'd like to update a file for you, but no file is currently open. Please open a file first.",
        operationPerformed: false,
      }
    }

    // Extract content
    let content = ""
    const contentMatch = message.match(/with(?:\s+the)?\s+content(?:\s+of)?:?\s+([\s\S]*)/i)
    if (contentMatch) {
      content = contentMatch[1].trim()
      // Remove code block markers if present
      content = content.replace(/^```[\w]*\n|```$/gm, "")
    } else {
      return {
        response:
          "I'd like to update the file for you, but I need the new content. Can you specify what content to use?",
        operationPerformed: false,
      }
    }

    // Update the file
    const success = await this.fileOperations.updateFile(currentFile, content)

    if (success) {
      return {
        response: `I've updated the file "${currentFile}" for you.`,
        operationPerformed: true,
      }
    } else {
      return {
        response: `I couldn't update the file "${currentFile}". Please check if the file exists or if you have the necessary permissions.`,
        operationPerformed: false,
      }
    }
  }

  // Handle delete file intent
  private async handleDeleteFile(message: string): Promise<{
    response: string
    operationPerformed: boolean
  }> {
    // Extract filename
    const filenameMatch = message.match(
      /delete(?:\s+the)?\s+file(?:\s+called|\s+named)?\s+["']?([a-zA-Z0-9_.-/]+)["']?/i,
    )
    if (!filenameMatch) {
      return {
        response: "I'd like to delete a file for you, but I need a filename. Can you specify which file to delete?",
        operationPerformed: false,
      }
    }

    const filename = filenameMatch[1]

    // Delete the file
    const success = await this.fileOperations.deleteFile(filename)

    if (success) {
      return {
        response: `I've deleted the file "${filename}" for you.`,
        operationPerformed: true,
      }
    } else {
      return {
        response: `I couldn't delete the file "${filename}". Please check if the file exists or if you have the necessary permissions.`,
        operationPerformed: false,
      }
    }
  }

  // Handle create directory intent
  private async handleCreateDirectory(
    message: string,
    currentDirectory: string,
  ): Promise<{
    response: string
    operationPerformed: boolean
  }> {
    // Extract directory name
    const dirnameMatch = message.match(
      /(?:create|new)(?:\s+a)?\s+(?:directory|folder)(?:\s+called|\s+named)?\s+["']?([a-zA-Z0-9_.-]+)["']?/i,
    )
    if (!dirnameMatch) {
      return {
        response:
          "I'd like to create a directory for you, but I need a name. Can you specify what to name the directory?",
        operationPerformed: false,
      }
    }

    const dirname = dirnameMatch[1]

    // Create the directory
    const success = await this.fileOperations.createDirectory(currentDirectory, dirname)

    if (success) {
      return {
        response: `I've created the directory "${dirname}" for you.`,
        operationPerformed: true,
      }
    } else {
      return {
        response: `I couldn't create the directory "${dirname}". Please check if the directory already exists or if you have the necessary permissions.`,
        operationPerformed: false,
      }
    }
  }
}
