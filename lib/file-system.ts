// File System Access API utilities for CRUD operations on local files and folders

declare global {
  interface Window {
    showDirectoryPicker(options?: DirectoryPickerOptions): Promise<FileSystemDirectoryHandle>
    showOpenFilePicker(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>
  }
  interface FileSystemDirectoryHandle {
    entries(): AsyncIterableIterator<[string, FileSystemHandle]>;
  }
}

interface DirectoryPickerOptions {
  mode?: 'read' | 'readwrite'
}

interface OpenFilePickerOptions {
  multiple?: boolean
}

export type FileSystemItem = {
  name: string
  kind: "file" | "directory"
  handle: FileSystemHandle
  children?: FileSystemItem[]
}

export class FileSystemManager {
  private rootDirectoryHandle: FileSystemDirectoryHandle | null = null
  private fileHandles: Map<string, FileSystemFileHandle> = new Map()
  private directoryHandles: Map<string, FileSystemDirectoryHandle> = new Map()

  public resetHandles() {
    this.rootDirectoryHandle = null
    this.fileHandles.clear()
    this.directoryHandles.clear()
  }

  public cacheHandle(path: string, item: FileSystemItem) {
    if (item.kind === "directory") {
      this.directoryHandles.set(path, item.handle as FileSystemDirectoryHandle)
      if (item.children) {
        for (const child of item.children) {
          this.cacheHandle(`${path === "/" ? "" : path}/${child.name}`.replace("//", "/"), child)
        }
      }
    } else if (item.kind === "file") {
      this.fileHandles.set(path, item.handle as FileSystemFileHandle)
    }
  }
  // Check if browser supports File System Access API
  public static isSupported(): boolean {
    return "showDirectoryPicker" in window && "showOpenFilePicker" in window
  }

  // Open a directory and get access to its contents
  public async openDirectory(): Promise<FileSystemItem | null> {
    try {
      // Request permission to access a directory
      this.rootDirectoryHandle = await window.showDirectoryPicker({
        mode: "readwrite",
      })

      // Store the root directory handle
      this.directoryHandles.set("/", this.rootDirectoryHandle)

      // Scan the directory and build the file tree
      return await this.scanDirectory(this.rootDirectoryHandle, "/")
    } catch (error) {
      console.error("Error opening directory:", error)
      return null
    }
  }

  // Open a single file
  public async openFile(): Promise<{ name: string; content: string } | null> {
    try {
      const [fileHandle] = await window.showOpenFilePicker()
      const file = await fileHandle.getFile()
      const content = await file.text()

      // Store the file handle
      this.fileHandles.set(file.name, fileHandle)

      return {
        name: file.name,
        content,
      }
    } catch (error) {
      console.error("Error opening file:", error)
      return null
    }
  }

  // Create a new file in the specified directory
  public async createFile(directoryPath: string, fileName: string, content = ""): Promise<boolean> {
    try {
      const dirHandle = await this.getDirectoryHandle(directoryPath)
      if (!dirHandle) return false

      // Create or overwrite the file
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true })

      // Write content to the file
      const writable = await fileHandle.createWritable()
      await writable.write(content)
      await writable.close()

      // Store the file handle
      this.fileHandles.set(`${directoryPath}/${fileName}`.replace("//", "/"), fileHandle)

      return true
    } catch (error) {
      console.error("Error creating file:", error)
      return false
    }
  }

  // Create a new directory
  public async createDirectory(parentPath: string, dirName: string): Promise<boolean> {
    try {
      const parentHandle = await this.getDirectoryHandle(parentPath)
      if (!parentHandle) return false

      // Create the directory
      const newDirHandle = await parentHandle.getDirectoryHandle(dirName, { create: true })

      // Store the directory handle
      this.directoryHandles.set(`${parentPath}/${dirName}`.replace("//", "/"), newDirHandle)

      return true
    } catch (error) {
      console.error("Error creating directory:", error)
      return false
    }
  }

  // Read a file's content
  public async readFile(filePath: string): Promise<string | null> {
    try {
      const fileHandle = await this.getFileHandle(filePath)
      if (!fileHandle) return null

      const file = await fileHandle.getFile()
      return await file.text()
    } catch (error) {
      console.error("Error reading file:", error)
      return null
    }
  }

  // Write content to a file
  public async writeFile(filePath: string, content: string): Promise<boolean> {
    try {
      const fileHandle = await this.getFileHandle(filePath)
      if (!fileHandle) return false

      const writable = await fileHandle.createWritable()
      await writable.write(content)
      await writable.close()

      return true
    } catch (error) {
      console.error("Error writing to file:", error)
      return false
    }
  }

  // Delete a file
  public async deleteFile(filePath: string): Promise<boolean> {
    try {
      const parts = filePath.split("/")
      const fileName = parts.pop() || ""
      const dirPath = parts.join("/")

      const dirHandle = await this.getDirectoryHandle(dirPath)
      if (!dirHandle) return false

      await dirHandle.removeEntry(fileName)

      // Remove from our cache
      this.fileHandles.delete(filePath)

      return true
    } catch (error) {
      console.error("Error deleting file:", error)
      return false
    }
  }

  // Delete a directory
  public async deleteDirectory(dirPath: string): Promise<boolean> {
    try {
      const parts = dirPath.split("/")
      const dirName = parts.pop() || ""
      const parentPath = parts.join("/")

      const parentHandle = await this.getDirectoryHandle(parentPath)
      if (!parentHandle) return false

      // This will fail if the directory is not empty, unless we set recursive to true
      await parentHandle.removeEntry(dirName, { recursive: true })

      // Remove from our cache
      this.directoryHandles.delete(dirPath)

      return true
    } catch (error) {
      console.error("Error deleting directory:", error)
      return false
    }
  }

  // Rename a file or directory
  public async rename(oldPath: string, newName: string): Promise<boolean> {
    try {
      // Get the parent directory path
      const parts = oldPath.split("/")
      const oldName = parts.pop() || ""
      const parentPath = parts.join("/")

      // Get the parent directory handle
      const parentHandle = await this.getDirectoryHandle(parentPath)
      if (!parentHandle) return false

      // Check if it's a file or directory
      const isFile = this.fileHandles.has(oldPath)

      if (isFile) {
        // For files, we need to read the content, create a new file, and delete the old one
        const content = await this.readFile(oldPath)
        if (content === null) return false

        // Create the new file
        const success = await this.createFile(parentPath, newName, content)
        if (!success) return false

        // Delete the old file
        await parentHandle.removeEntry(oldName)
        this.fileHandles.delete(oldPath)

        return true
      } else {
        // For directories, we need to copy all contents to a new directory and delete the old one
        // This is complex and not directly supported by the File System Access API
        // For simplicity, we'll return false for now
        console.error("Directory renaming is not supported yet")
        return false
      }
    } catch (error) {
      console.error("Error renaming:", error)
      return false
    }
  }

  // Scan a directory and build a file tree
  private async scanDirectory(dirHandle: FileSystemDirectoryHandle, path: string): Promise<FileSystemItem> {
    const children: FileSystemItem[] = []

    // Iterate through all entries in the directory
    for await (const [name, handle] of dirHandle.entries()) {
      const childPath = `${path}/${name}`.replace("//", "/")

      if (handle.kind === "file") {
        // Store file handle
        this.fileHandles.set(childPath, handle as FileSystemFileHandle)

        children.push({
          name,
          kind: "file",
          handle,
        })
      } else if (handle.kind === "directory") {
        // Store directory handle
        this.directoryHandles.set(childPath, handle as FileSystemDirectoryHandle)

        // Recursively scan subdirectories
        const subDir = await this.scanDirectory(handle as FileSystemDirectoryHandle, childPath)
        children.push(subDir)
      }
    }

    return {
      name: dirHandle.name,
      kind: "directory",
      handle: dirHandle,
      children,
    }
  }

  // Helper to get a directory handle from a path
  private async getDirectoryHandle(path: string): Promise<FileSystemDirectoryHandle | null> {
    if (!this.rootDirectoryHandle) return null

    // Root directory
    if (path === "/" || path === "") {
      return this.rootDirectoryHandle
    }

    // Check if we already have this directory handle cached
    if (this.directoryHandles.has(path)) {
      return this.directoryHandles.get(path) || null
    }

    // Navigate to the directory
    const parts = path.split("/").filter(Boolean)
    let currentDir = this.rootDirectoryHandle

    for (const part of parts) {
      try {
        currentDir = await currentDir.getDirectoryHandle(part)
      } catch (error) {
        console.error(`Directory not found: ${part} in ${path}`)
        return null
      }
    }

    // Cache the handle
    this.directoryHandles.set(path, currentDir)

    return currentDir
  }

  // Helper to get a file handle from a path
  private async getFileHandle(path: string): Promise<FileSystemFileHandle | null> {
    // Check if we already have this file handle cached
    if (this.fileHandles.has(path)) {
      return this.fileHandles.get(path) || null
    }

    // Get the directory and file name
    const parts = path.split("/")
    const fileName = parts.pop() || ""
    const dirPath = parts.join("/")

    // Get the directory handle
    const dirHandle = await this.getDirectoryHandle(dirPath)
    if (!dirHandle) return null

    try {
      // Get the file handle
      const fileHandle = await dirHandle.getFileHandle(fileName)

      // Cache the handle
      this.fileHandles.set(path, fileHandle)

      return fileHandle
    } catch (error) {
      console.error(`File not found: ${fileName} in ${dirPath}`)
      return null
    }
  }


}
