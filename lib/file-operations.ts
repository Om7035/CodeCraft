import type { FileSystemManager } from "./file-system"

// This service handles file operations and can be used by both the UI and AI assistant
export class FileOperationsService {
  private fileSystemManager: FileSystemManager
  private onFileChange: (operation: string, path: string) => void

  constructor(fileSystemManager: FileSystemManager, onFileChange: (operation: string, path: string) => void) {
    this.fileSystemManager = fileSystemManager
    this.onFileChange = onFileChange
  }

  // Create a new file
  async createFile(path: string, filename: string, content = ""): Promise<boolean> {
    try {
      const fullPath = path === "/" ? `/${filename}` : `${path}/${filename}`
      const success = await this.fileSystemManager.createFile(path, filename, content)

      if (success) {
        this.onFileChange("create", fullPath)
        return true
      }
      return false
    } catch (error) {
      console.error("Error creating file:", error)
      return false
    }
  }

  // Read a file's content
  async readFile(path: string): Promise<string | null> {
    try {
      return await this.fileSystemManager.readFile(path)
    } catch (error) {
      console.error("Error reading file:", error)
      return null
    }
  }

  // Update a file's content
  async updateFile(path: string, content: string): Promise<boolean> {
    try {
      const success = await this.fileSystemManager.writeFile(path, content)

      if (success) {
        this.onFileChange("update", path)
        return true
      }
      return false
    } catch (error) {
      console.error("Error updating file:", error)
      return false
    }
  }

  // Delete a file
  async deleteFile(path: string): Promise<boolean> {
    try {
      const success = await this.fileSystemManager.deleteFile(path)

      if (success) {
        this.onFileChange("delete", path)
        return true
      }
      return false
    } catch (error) {
      console.error("Error deleting file:", error)
      return false
    }
  }

  // Create a new directory
  async createDirectory(path: string, dirname: string): Promise<boolean> {
    try {
      const fullPath = path === "/" ? `/${dirname}` : `${path}/${dirname}`
      const success = await this.fileSystemManager.createDirectory(path, dirname)

      if (success) {
        this.onFileChange("create", fullPath)
        return true
      }
      return false
    } catch (error) {
      console.error("Error creating directory:", error)
      return false
    }
  }

  // Delete a directory
  async deleteDirectory(path: string): Promise<boolean> {
    try {
      const success = await this.fileSystemManager.deleteDirectory(path)

      if (success) {
        this.onFileChange("delete", path)
        return true
      }
      return false
    } catch (error) {
      console.error("Error deleting directory:", error)
      return false
    }
  }

  // Rename a file or directory
  async rename(oldPath: string, newName: string): Promise<boolean> {
    try {
      const success = await this.fileSystemManager.rename(oldPath, newName)

      if (success) {
        this.onFileChange("rename", oldPath)
        return true
      }
      return false
    } catch (error) {
      console.error("Error renaming:", error)
      return false
    }
  }
}
