"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Clipboard, RotateCcw } from "lucide-react"

export default function TerminalComponent() {
  const [history, setHistory] = useState<string[]>([
    "> Welcome to CodeCraft Terminal",
    '> Type "help" for a list of commands',
  ])
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const executeCommand = (cmd: string) => {
    const args = cmd.trim().split(/\s+/)
    const command = args[0].toLowerCase()

    let response = ""

    switch (command) {
      case "help":
        response = `Available commands:
  help - Show this help message
  clear - Clear the terminal
  ls - List files in current directory
  cd - Change directory
  mkdir - Create a directory
  touch - Create a file
  echo - Print text
  cat - Print file contents
  pwd - Print working directory
  date - Show current date and time
  version - Show CodeCraft version`
        break

      case "clear":
        setHistory([])
        return

      case "ls":
        response = "index.js\npackage.json\nREADME.md\nsrc/"
        break

      case "cd":
        if (args.length < 2) {
          response = "Usage: cd <directory>"
        } else {
          response = `Changed directory to ${args[1]}`
        }
        break

      case "mkdir":
        if (args.length < 2) {
          response = "Usage: mkdir <directory>"
        } else {
          response = `Created directory ${args[1]}`
        }
        break

      case "touch":
        if (args.length < 2) {
          response = "Usage: touch <file>"
        } else {
          response = `Created file ${args[1]}`
        }
        break

      case "echo":
        response = args.slice(1).join(" ")
        break

      case "cat":
        if (args.length < 2) {
          response = "Usage: cat <file>"
        } else if (args[1] === "package.json") {
          response = `{
  "name": "my-project",
  "version": "1.0.0",
  "description": "A sample project",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  }
}`
        } else {
          response = `File not found: ${args[1]}`
        }
        break

      case "pwd":
        response = "/home/user/projects/my-project"
        break

      case "date":
        response = new Date().toString()
        break

      case "version":
        response = "CodeCraft IDE v1.0.0"
        break

      default:
        if (command) {
          response = `Command not found: ${command}. Type 'help' for a list of commands.`
        }
    }

    return response
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault()
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput("")
      }
    }
  }

  const clearTerminal = () => {
    setHistory([])
  }

  const copyToClipboard = () => {
    const text = history.join("\n")
    navigator.clipboard.writeText(text)
  }

  const handleCommand = (cmd: string) => {
    const command = cmd.trim().toLowerCase()
    let response = ""

    if (command === "help") {
      response = "Available commands: help, clear, version, echo [text]"
    } else if (command === "clear") {
      setHistory([])
      return
    } else if (command === "version") {
      response = "CodeCraft IDE v1.0.0"
    } else if (command.startsWith("echo ")) {
      response = command.substring(5)
    } else if (command) {
      response = `Command not found: ${command}`
    }

    setHistory((prev) => [...prev, `> ${cmd}`, response].filter(Boolean))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      const response = executeCommand(input)
      if (response !== undefined) {
        setHistory((prev) => [...prev, `> ${input}`, response].filter(Boolean))
      }

      // Update command history
      setCommandHistory((prev) => [...prev, input])
      setHistoryIndex(-1)
      setInput("")
    }
  }

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [history])

  useEffect(() => {
    const handleClick = () => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  return (
    <div className="h-full flex flex-col bg-gray-950 text-gray-300 font-mono text-sm">
      <div className="p-2 flex justify-between items-center border-b border-gray-800">
        <span>Terminal</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyToClipboard}>
            <Clipboard className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearTerminal}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div ref={terminalRef} className="flex-1 p-2 overflow-y-auto" onClick={() => inputRef.current?.focus()}>
        {history.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap mb-1">
            {line}
          </div>
        ))}
        <form onSubmit={handleSubmit} className="flex items-center">
          <span className="text-green-500 mr-2">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none"
            autoFocus
          />
        </form>
      </div>
    </div>
  )
}
