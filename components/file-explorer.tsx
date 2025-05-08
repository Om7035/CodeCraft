"use client"

import { useState, useEffect } from "react"
import { Folder, File, ChevronRight, ChevronDown, FolderPlus, FilePlus, Trash2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

interface FileExplorerProps {
  onFileSelect: (file: string) => void
  currentFile: string
  refreshKey?: number
  onDeleteFile?: (path: string) => void
  onCreateFile?: () => void
  onCreateFolder?: () => void
}

// Sample file structure
const initialFiles = {
  src: {
    type: "folder",
    children: {
      components: {
        type: "folder",
        children: {
          "Button.jsx": { type: "file" },
          "Navbar.jsx": { type: "file" },
        },
      },
      pages: {
        type: "folder",
        children: {
          "index.js": { type: "file" },
          "about.js": { type: "file" },
        },
      },
      styles: {
        type: "folder",
        children: {
          "global.css": { type: "file" },
        },
      },
      utils: {
        type: "folder",
        children: {
          "helpers.js": { type: "file" },
        },
      },
    },
  },
  "package.json": { type: "file" },
  "README.md": { type: "file" },
  "index.js": { type: "file" },
}

export default function FileExplorer({
  onFileSelect,
  currentFile,
  refreshKey = 0,
  onDeleteFile,
  onCreateFile,
  onCreateFolder,
}: FileExplorerProps) {
  const [files, setFiles] = useState(initialFiles)
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    src: true,
  })

  // Refresh file explorer when refreshKey changes
  useEffect(() => {
    // In a real implementation, this would fetch the latest file structure
    console.log("Refreshing file explorer", refreshKey)
  }, [refreshKey])

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }))
  }

  const handleDeleteItem = (path: string, isFolder: boolean) => {
    if (onDeleteFile && !isFolder) {
      onDeleteFile(path)
    } else {
      // In a real implementation, this would call an API to delete the folder
      // For now, we'll just update our state
      const pathParts = path.split("/")
      const itemName = pathParts.pop() || ""
      const parentPath = pathParts.join("/")

      setFiles((prev) => {
        const newFiles = JSON.parse(JSON.stringify(prev))
        let current = newFiles

        // Navigate to parent folder
        if (parentPath) {
          for (const part of parentPath.split("/")) {
            current = current[part].children
          }
        }

        // Delete the item
        delete current[itemName]
        return newFiles
      })
    }
  }

  const renderFileTree = (items: any, path = "") => {
    return Object.entries(items).map(([name, details]: [string, any]) => {
      const currentPath = path ? `${path}/${name}` : name
      const isFolder = details.type === "folder"

      if (isFolder) {
        const isExpanded = expandedFolders[currentPath]

        return (
          <ContextMenu key={currentPath}>
            <ContextMenuTrigger>
              <div className="group">
                <div
                  className="flex items-center py-1 px-2 hover:bg-gray-800 cursor-pointer text-gray-300 hover:text-white group-hover:bg-gray-800/50"
                  onClick={() => toggleFolder(currentPath)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 mr-1 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-1 text-gray-500" />
                  )}
                  <Folder className="h-4 w-4 mr-2 text-blue-400" />
                  <span className="text-sm flex-1">{name}</span>
                </div>

                {isExpanded && <div className="ml-4">{renderFileTree(details.children, currentPath)}</div>}
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
              <ContextMenuItem onClick={onCreateFile}>
                <FilePlus className="h-4 w-4 mr-2" />
                New File
              </ContextMenuItem>
              <ContextMenuItem onClick={onCreateFolder}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => handleDeleteItem(currentPath, true)} className="text-red-500">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )
      } else {
        return (
          <ContextMenu key={currentPath}>
            <ContextMenuTrigger>
              <div
                className={`flex items-center py-1 px-2 hover:bg-gray-800 cursor-pointer group ${
                  name === currentFile ? "bg-gray-800 text-white" : "text-gray-300 hover:text-white"
                }`}
                onClick={() => onFileSelect(currentPath)}
              >
                <File className="h-4 w-4 mr-2 text-gray-400" />
                <span className="text-sm flex-1">{name}</span>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
              <ContextMenuItem onClick={() => onFileSelect(currentPath)}>Open</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => handleDeleteItem(currentPath, false)} className="text-red-500">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )
      }
    })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 flex justify-between items-center border-b border-gray-800">
        <h3 className="text-sm font-medium">Explorer</h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCreateFile}>
            <FilePlus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCreateFolder}>
            <FolderPlus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {}}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-1">{renderFileTree(files)}</div>
    </div>
  )
}
