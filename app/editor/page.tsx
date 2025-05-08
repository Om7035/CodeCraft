"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Code,
  ArrowLeft,
  Save,
  Play,
  Terminal,
  Folder,
  Settings,
  X,
  Search,
  GitBranch,
  Bell,
  LayoutGrid,
  PanelLeft,
  Zap,
  Download,
  RefreshCw,
  Braces,
  FileText,
  Copy,
  Scissors,
  Clipboard,
  File,
  Loader2,
  FolderOpen,
  FilePlus,
  FolderPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import CodeEditor from "@/components/code-editor"
import FileExplorer from "@/components/file-explorer"
import TerminalConnector from "@/components/terminal-connector"
import AIAssistant from "@/components/ai-assistant"
import { ResizablePanel } from "@/components/resizable-panel"
import { FileSystemManager, type FileSystemItem } from "@/lib/file-system"
import { FileOperationsService } from "@/lib/file-operations"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function EditorPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [showAI, setShowAI] = useState(false)
  const [currentFile, setCurrentFile] = useState("index.js")
  const [currentDirectory, setCurrentDirectory] = useState("/")
  const [fileContent, setFileContent] = useState("// Start coding here")
  const [openFiles, setOpenFiles] = useState<string[]>(["index.js"])
  const [activeTab, setActiveTab] = useState("index.js")
  const [fileContents, setFileContents] = useState<Record<string, string>>({
    "index.js": "// Start coding here",
    "package.json": `{
  "name": "my-project",
  "version": "1.0.0",
  "description": "A sample project",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  }
}`,
    "README.md": "# My Project\n\nThis is a sample project created with CodeCraft IDE.",
  })
  const [showSidebar, setShowSidebar] = useState(true)
  const [showTerminal, setShowTerminal] = useState(false)
  const [sidebarTab, setSidebarTab] = useState("files")
  const [editorTheme, setEditorTheme] = useState("dark")
  const [statusMessage, setStatusMessage] = useState("Ready")
  const [gitBranch, setGitBranch] = useState("main")
  const [notifications, setNotifications] = useState(0)
  const [fileSystemSupported, setFileSystemSupported] = useState(false)
  const [projectRoot, setProjectRoot] = useState<FileSystemItem | null>(null)
  const [showNewFileDialog, setShowNewFileDialog] = useState(false)
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newItemName, setNewItemName] = useState("")
  const [refreshFileExplorer, setRefreshFileExplorer] = useState(0)

  const fileSystemManager = useRef<FileSystemManager | null>(null)
  const fileOperationsService = useRef<FileOperationsService | null>(null)

  // Check if File System Access API is supported
  useEffect(() => {
    setFileSystemSupported(FileSystemManager.isSupported())
    fileSystemManager.current = new FileSystemManager()

    // Initialize file operations service
    if (fileSystemManager.current) {
      fileOperationsService.current = new FileOperationsService(fileSystemManager.current, (operation, path) => {
        // Handle file change events
        console.log(`File operation: ${operation} on ${path}`)
        // Refresh file explorer
        setRefreshFileExplorer((prev) => prev + 1)

        // Show toast notification
        toast({
          title: "File Operation",
          description: `${operation.charAt(0).toUpperCase() + operation.slice(1)}d ${path}`,
        })
      })
    }
  }, [toast])

  useEffect(() => {
    // Simulate loading the editor
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Show a welcome toast when the editor loads
    if (!loading) {
      toast({
        title: "Gemini AI Ready",
        description: "CodeCraft IDE is now connected to Gemini AI for intelligent code assistance and file operations.",
      })
    }
  }, [loading, toast])

  // Open a project directory
  const openProjectDirectory = async () => {
    if (!fileSystemManager.current) return

    try {
      const rootDir = await fileSystemManager.current.openDirectory()
      if (rootDir) {
        // Clear existing handles and reset state
        fileSystemManager.current.resetHandles()
        setProjectRoot(null)
        
        // Store root handle and update state
        fileSystemManager.current.cacheHandle('/', rootDir)
        setProjectRoot(rootDir)
        setCurrentDirectory('/')
        
        // Force full UI refresh
        setRefreshFileExplorer(prev => prev + 1)
        setOpenFiles([])
        
        toast({
          title: "Project Opened",
          description: `Loaded project: ${rootDir.name}`,
        })
      }
    } catch (error) {
      console.error("Opening error:", error)
      toast({
        title: "Open Failed",
        description: error instanceof Error ? error.message : 'Cannot access directory',
        variant: "destructive"
      })
    }
  }

  // Open a file
  const openFile = async (filePath: string) => {
    // If using File System Access API
    if (projectRoot && fileSystemManager.current) {
      try {
        const content = await fileSystemManager.current.readFile(filePath)
        if (content !== null) {
          setCurrentFile(filePath)
          setFileContent(content)

          // Update current directory
          const lastSlashIndex = filePath.lastIndexOf("/")
          if (lastSlashIndex > 0) {
            setCurrentDirectory(filePath.substring(0, lastSlashIndex))
          } else {
            setCurrentDirectory("/")
          }

          if (!openFiles.includes(filePath)) {
            setOpenFiles((prev) => [...prev, filePath])
          }

          setActiveTab(filePath)
          setFileContents((prev) => ({
            ...prev,
            [filePath]: content,
          }))
        }
      } catch (error) {
        console.error("Error opening file:", error)
        toast({
          title: "Error",
          description: `Failed to open file: ${filePath}`,
          variant: "destructive",
        })
      }
    } else {
      // Using mock file system
      setCurrentFile(filePath)

      // Update current directory
      const lastSlashIndex = filePath.lastIndexOf("/")
      if (lastSlashIndex > 0) {
        setCurrentDirectory(filePath.substring(0, lastSlashIndex))
      } else {
        setCurrentDirectory("/")
      }

      if (!openFiles.includes(filePath)) {
        setOpenFiles((prev) => [...prev, filePath])
      }

      setActiveTab(filePath)

      // Initialize file content if it doesn't exist
      if (!fileContents[filePath]) {
        setFileContents((prev) => ({
          ...prev,
          [filePath]: "",
        }))
      } else {
        setFileContent(fileContents[filePath])
      }
    }
  }

  // Close a file tab
  const closeFile = (filename: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }

    setOpenFiles((prev) => prev.filter((f) => f !== filename))

    // If we're closing the active tab, switch to another tab
    if (activeTab === filename) {
      const index = openFiles.indexOf(filename)
      if (index > 0) {
        setActiveTab(openFiles[index - 1])
        setCurrentFile(openFiles[index - 1])
        setFileContent(fileContents[openFiles[index - 1]] || "")
      } else if (openFiles.length > 1) {
        setActiveTab(openFiles[1])
        setCurrentFile(openFiles[1])
        setFileContent(fileContents[openFiles[1]] || "")
      } else {
        setActiveTab("")
        setCurrentFile("")
        setFileContent("")
      }
    }
  }

  // Update file content
  const updateFileContent = (content: string) => {
    setFileContent(content)
    setFileContents((prev) => ({
      ...prev,
      [currentFile]: content,
    }))
  }

  // Save current file
  const saveCurrentFile = async () => {
    if (!currentFile) return

    // If using File System Access API
    if (projectRoot && fileOperationsService.current) {
      try {
        const success = await fileOperationsService.current.updateFile(currentFile, fileContent)
        if (success) {
          setStatusMessage(`Saved ${currentFile}`)
          toast({
            title: "File Saved",
            description: `Successfully saved ${currentFile}`,
          })
        } else {
          throw new Error("Failed to save file")
        }
      } catch (error) {
        console.error("Error saving file:", error)
        toast({
          title: "Error",
          description: `Failed to save file: ${currentFile}`,
          variant: "destructive",
        })
      }
    } else {
      // Using mock file system
      setStatusMessage(`Saved ${currentFile}`)
      setTimeout(() => setStatusMessage("Ready"), 2000)
      toast({
        title: "File Saved",
        description: `Successfully saved ${currentFile}`,
      })
    }
  }

  // Create a new file
  const createNewFile = async () => {
    if (!newItemName.trim()) return

    if (fileOperationsService.current) {
      const success = await fileOperationsService.current.createFile(currentDirectory, newItemName, "")
      if (success) {
        const filePath = currentDirectory === "/" ? `/${newItemName}` : `${currentDirectory}/${newItemName}`
        openFile(filePath)
        setShowNewFileDialog(false)
        setNewItemName("")
      } else {
        toast({
          title: "Error",
          description: `Failed to create file: ${newItemName}`,
          variant: "destructive",
        })
      }
    } else {
      // Using mock file system
      const filePath = currentDirectory === "/" ? `/${newItemName}` : `${currentDirectory}/${newItemName}`
      setFileContents((prev) => ({
        ...prev,
        [filePath]: "",
      }))
      openFile(filePath)
      setShowNewFileDialog(false)
      setNewItemName("")

      // Refresh file explorer
      setRefreshFileExplorer((prev) => prev + 1)
    }
  }

  // Create a new folder
  const createNewFolder = async () => {
    if (!newItemName.trim()) return

    if (fileOperationsService.current) {
      const success = await fileOperationsService.current.createDirectory(currentDirectory, newItemName)
      if (success) {
        setShowNewFolderDialog(false)
        setNewItemName("")
        // Refresh file explorer
        setRefreshFileExplorer((prev) => prev + 1)
      } else {
        toast({
          title: "Error",
          description: `Failed to create folder: ${newItemName}`,
          variant: "destructive",
        })
      }
    } else {
      // Using mock file system
      setShowNewFolderDialog(false)
      setNewItemName("")

      // Refresh file explorer
      setRefreshFileExplorer((prev) => prev + 1)

      toast({
        title: "Folder Created",
        description: `Created folder: ${newItemName}`,
      })
    }
  }

  // Delete a file
  const deleteFile = async (filePath: string) => {
    if (fileOperationsService.current) {
      const success = await fileOperationsService.current.deleteFile(filePath)
      if (success) {
        // If the file is open, close it
        if (openFiles.includes(filePath)) {
          closeFile(filePath)
        }

        // Refresh file explorer
        setRefreshFileExplorer((prev) => prev + 1)

        toast({
          title: "File Deleted",
          description: `Deleted file: ${filePath}`,
        })
      } else {
        toast({
          title: "Error",
          description: `Failed to delete file: ${filePath}`,
          variant: "destructive",
        })
      }
    } else {
      // Using mock file system
      // If the file is open, close it
      if (openFiles.includes(filePath)) {
        closeFile(filePath)
      }

      // Remove from file contents
      const newFileContents = { ...fileContents }
      delete newFileContents[filePath]
      setFileContents(newFileContents)

      // Refresh file explorer
      setRefreshFileExplorer((prev) => prev + 1)

      toast({
        title: "File Deleted",
        description: `Deleted file: ${filePath}`,
      })
    }
  }

  // Run code
  const runCode = () => {
    setShowTerminal(true)
    setStatusMessage("Running code...")
    setTimeout(() => setStatusMessage("Ready"), 2000)
  }

  // Toggle sidebar
  const toggleSidebar = () => {
    setShowSidebar((prev) => !prev)
  }

  // Toggle terminal
  const toggleTerminal = () => {
    setShowTerminal((prev) => !prev)
  }

  // Get file icon based on extension
  const getFileIcon = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase()

    switch (extension) {
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
        return <Braces className="h-4 w-4 mr-2 text-yellow-400" />
      case "json":
        return <Braces className="h-4 w-4 mr-2 text-yellow-600" />
      case "md":
        return <FileText className="h-4 w-4 mr-2 text-blue-400" />
      case "css":
        return <FileText className="h-4 w-4 mr-2 text-blue-600" />
      case "html":
        return <FileText className="h-4 w-4 mr-2 text-orange-400" />
      case "svg":
        return <FileText className="h-4 w-4 mr-2 text-green-400" />
      default:
        return <File className="h-4 w-4 mr-2 text-gray-400" />
    }
  }

  // Handle file explorer refresh
  const handleRefreshFileExplorer = () => {
    setRefreshFileExplorer((prev) => prev + 1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
          <h2 className="text-xl text-white">Loading CodeCraft IDE...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      {/* New File Dialog */}
      <Dialog open={showNewFileDialog} onOpenChange={setShowNewFileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New File</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="File name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFileDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createNewFile}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Folder name"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createNewFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="border-b border-gray-800 p-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <Separator orientation="vertical" className="mx-2 h-6" />
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-blue-500" />
              <span className="font-semibold">CodeCraft</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  File
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setShowNewFileDialog(true)}>
                  <FilePlus className="h-4 w-4 mr-2" />
                  New File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowNewFolderDialog(true)}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={saveCurrentFile} disabled={!currentFile}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={openProjectDirectory} disabled={!fileSystemSupported}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Open Folder
                  {!fileSystemSupported && (
                    <span className="ml-2 text-xs text-red-500">(Not supported in this browser)</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Scissors className="h-4 w-4 mr-2" />
                  Cut
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Clipboard className="h-4 w-4 mr-2" />
                  Paste
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={toggleSidebar}>
                  <PanelLeft className="h-4 w-4 mr-2" />
                  Toggle Sidebar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTerminal}>
                  <Terminal className="h-4 w-4 mr-2" />
                  Toggle Terminal
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Split Editor
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  Run
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={runCode}>
                  <Play className="h-4 w-4 mr-2" />
                  Run Current File
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restart
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <div className="w-12 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={sidebarTab === "files" ? "secondary" : "ghost"}
                  size="icon"
                  className="mb-2"
                  onClick={() => {
                    setSidebarTab("files")
                    setShowSidebar(true)
                  }}
                >
                  <Folder className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Explorer</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={sidebarTab === "search" ? "secondary" : "ghost"}
                  size="icon"
                  className="mb-2"
                  onClick={() => {
                    setSidebarTab("search")
                    setShowSidebar(true)
                  }}
                >
                  <Search className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Search</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={sidebarTab === "git" ? "secondary" : "ghost"}
                  size="icon"
                  className="mb-2"
                  onClick={() => {
                    setSidebarTab("git")
                    setShowSidebar(true)
                  }}
                >
                  <GitBranch className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Source Control</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="mb-2 relative" onClick={() => setNotifications(0)}>
                  <Bell className="h-5 w-5" />
                  {notifications > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-blue-500 rounded-full text-xs flex items-center justify-center">
                      {notifications}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Notifications</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex-1"></div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showAI ? "secondary" : "ghost"}
                  size="icon"
                  className="mb-2"
                  onClick={() => setShowAI(!showAI)}
                >
                  <Zap className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>AI Assistant</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="w-64 border-r border-gray-800 flex flex-col">
            <Tabs value={sidebarTab} className="flex-1">
              <TabsList className="grid grid-cols-3 bg-gray-900">
                <TabsTrigger value="files" onClick={() => setSidebarTab("files")}>
                  <Folder className="h-4 w-4 mr-2" />
                  Files
                </TabsTrigger>
                <TabsTrigger value="search" onClick={() => setSidebarTab("search")}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </TabsTrigger>
                <TabsTrigger value="git" onClick={() => setSidebarTab("git")}>
                  <GitBranch className="h-4 w-4 mr-2" />
                  Git
                </TabsTrigger>
              </TabsList>
              <TabsContent value="files" className="flex-1 p-0">
                <FileExplorer
                  onFileSelect={(file) => openFile(file)}
                  currentFile={currentFile}
                  refreshKey={refreshFileExplorer}
                  onDeleteFile={deleteFile}
                  onCreateFile={() => setShowNewFileDialog(true)}
                  onCreateFolder={() => setShowNewFolderDialog(true)}
                />
              </TabsContent>
              <TabsContent value="search" className="p-4">
                <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <input
                      type="text"
                      placeholder="Search in files"
                      className="bg-gray-800 text-white px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-xs">
                        Match Case
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs">
                        Regex
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">No results found</div>
                </div>
              </TabsContent>
              <TabsContent value="git" className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Branch</span>
                    <span className="text-sm bg-blue-900 px-2 py-1 rounded">{gitBranch}</span>
                  </div>
                  <div className="text-sm text-gray-400">No changes detected</div>
                  <Button variant="outline" size="sm" className="w-full">
                    <GitBranch className="h-4 w-4 mr-2" />
                    Create Branch
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <ScrollArea className="border-b border-gray-800">
            <div className="flex bg-gray-900">
              {openFiles.map((file) => (
                <div
                  key={file}
                  className={`flex items-center px-3 py-2 border-r border-gray-800 cursor-pointer ${
                    activeTab === file ? "bg-gray-950" : "bg-gray-900 hover:bg-gray-800"
                  }`}
                  onClick={() => {
                    setActiveTab(file)
                    setCurrentFile(file)
                    setFileContent(fileContents[file] || "")
                  }}
                >
                  {getFileIcon(file)}
                  <span className="text-sm">{file.split("/").pop()}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-2 opacity-50 hover:opacity-100"
                    onClick={(e) => closeFile(file, e)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            {currentFile ? (
              <CodeEditor
                value={fileContent}
                onChange={updateFileContent}
                language={currentFile.split(".").pop() || "javascript"}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FolderOpen className="h-16 w-16 mb-4" />
                <p className="text-xl mb-2">No file open</p>
                <p className="text-sm max-w-md text-center">
                  Open a file from the explorer or create a new file to start coding
                </p>
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => setShowNewFileDialog(true)}>
                    <FilePlus className="h-4 w-4 mr-2" />
                    New File
                  </Button>
                  {fileSystemSupported && (
                    <Button variant="outline" onClick={openProjectDirectory}>
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Open Folder
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Terminal (Collapsible) */}
          {showTerminal && (
            <div className="h-1/3 border-t border-gray-800">
              <div className="flex items-center justify-between bg-gray-900 px-2 py-1 border-b border-gray-800">
                <span className="text-sm">Terminal</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowTerminal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="h-full">
                <TerminalConnector />
              </div>
            </div>
          )}
        </div>

        {/* AI Assistant Panel */}
        {showAI && (
          <ResizablePanel side="right" defaultWidth={350} minWidth={250} maxWidth={600}>
            <div className="h-full flex flex-col">
              <div className="bg-gray-900 p-2 border-b border-gray-800 flex justify-between items-center">
                <h3 className="text-sm font-medium">AI Assistant (Gemini)</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAI(false)} className="h-6 w-6 p-0">
                  &times;
                </Button>
              </div>
              <AIAssistant
                code={fileContent}
                currentFile={currentFile}
                currentDirectory={currentDirectory}
                fileOperationsService={fileOperationsService.current}
                onRefreshFileExplorer={handleRefreshFileExplorer}
              />
            </div>
          </ResizablePanel>
        )}
      </div>

      {/* Status Bar */}
      <footer className="border-t border-gray-800 bg-gray-900 px-2 py-1 flex justify-between items-center text-xs text-gray-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <GitBranch className="h-3.5 w-3.5 mr-1" />
            {gitBranch}
          </div>
          <div>{statusMessage}</div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-5 px-1 text-xs" onClick={toggleTerminal}>
            <Terminal className="h-3.5 w-3.5 mr-1" />
            Terminal
          </Button>
          <div>{currentFile ? currentFile.split(".").pop()?.toUpperCase() || "TXT" : "TXT"} • UTF-8</div>
          <div>Ln 1, Col 1</div>
        </div>
      </footer>
    </div>
  )
}
