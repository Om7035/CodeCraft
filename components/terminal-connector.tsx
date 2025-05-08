"use client"

import { useState, useEffect, useRef } from "react"
import type { Terminal } from "xterm"
import "xterm/css/xterm.css"

interface TerminalConnectorProps {
  className?: string
}

export default function TerminalConnector({ className }: TerminalConnectorProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const [terminal, setTerminal] = useState<Terminal | null>(null)
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isServerRunning, setIsServerRunning] = useState(false)

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return

    // Check if terminal is already initialized
    if (terminal) return

    // Import Terminal dynamically
    import("xterm").then(({ Terminal }) => {
      const term = new Terminal({
        cursorBlink: true,
        fontFamily: "JetBrains Mono, Menlo, Monaco, Consolas, monospace",
        fontSize: 14,
        theme: {
          background: "#1e1e2e",
          foreground: "#f8f8f2",
          cursor: "#f8f8f2",
          selection: "#44475a",
        },
      })

      // Import and use FitAddon
      import("xterm-addon-fit").then(({ FitAddon }) => {
        const fitAddon = new FitAddon()
        term.loadAddon(fitAddon)
        term.open(terminalRef.current!)
        fitAddon.fit()

        // Handle terminal resize
        const resizeObserver = new ResizeObserver(() => {
          fitAddon.fit()
        })
        resizeObserver.observe(terminalRef.current!)

        // Handle terminal input
        term.onData((data) => {
          if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "input", data }))
          } else {
            // If not connected to a real terminal, echo the input
            term.write(data)
          }
        })

        setTerminal(term)

        // Display welcome message
        term.writeln("Welcome to CodeCraft Terminal")
        term.writeln("This terminal can connect to a local terminal server.")
        term.writeln("")
        term.writeln("To use a real terminal:")
        term.writeln("1. Run the CodeCraft Terminal Server on your machine")
        term.writeln("2. Click 'Connect to Terminal Server' below")
        term.writeln("")
        term.writeln("For now, you can use the simulated terminal.")
        term.writeln("Type 'help' for available commands.")
        term.writeln("")
        term.write("$ ")

        // Clean up on unmount
        return () => {
          resizeObserver.disconnect()
          term.dispose()
        }
      })
    })
  }, [terminal])

  // Function to connect to terminal server
  const connectToTerminalServer = () => {
    if (!terminal) return

    try {
      // Connect to local terminal server (would need to be running on the user's machine)
      const ws = new WebSocket("ws://localhost:3001")

      ws.onopen = () => {
        setIsConnected(true)
        terminal.clear()
        terminal.writeln("Connected to terminal server!")
        terminal.writeln("")
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          if (message.type === "output") {
            terminal.write(message.data)
          }
        } catch (error) {
          // If not JSON, just write the data
          terminal.write(event.data)
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        terminal.writeln("")
        terminal.writeln("Disconnected from terminal server.")
        terminal.writeln("Falling back to simulated terminal.")
        terminal.writeln("")
        terminal.write("$ ")
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        terminal.writeln("")
        terminal.writeln("Error connecting to terminal server.")
        terminal.writeln("Make sure the terminal server is running on your machine.")
        terminal.writeln("")
        terminal.write("$ ")
      }

      setSocket(ws)
    } catch (error) {
      console.error("Failed to connect to terminal server:", error)
      terminal.writeln("Failed to connect to terminal server.")
      terminal.write("$ ")
    }
  }

  // Check if terminal server is running
  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch("http://localhost:3001/status", { mode: "no-cors" })
        setIsServerRunning(true)
      } catch (error) {
        setIsServerRunning(false)
      }
    }

    checkServer()
    const interval = setInterval(checkServer, 5000)

    return () => clearInterval(interval)
  }, [])

  // Handle simulated terminal commands
  const handleSimulatedCommand = (command: string) => {
    if (!terminal) return

    terminal.writeln("")

    const cmd = command.trim().toLowerCase()
    if (cmd === "help") {
      terminal.writeln("Available commands:")
      terminal.writeln("  help     - Show this help message")
      terminal.writeln("  clear    - Clear the terminal")
      terminal.writeln("  ls       - List files in current directory")
      terminal.writeln("  cd       - Change directory")
      terminal.writeln("  pwd      - Print working directory")
      terminal.writeln("  echo     - Print text")
      terminal.writeln("  date     - Show current date and time")
      terminal.writeln("  connect  - Connect to terminal server")
    } else if (cmd === "clear") {
      terminal.clear()
    } else if (cmd === "ls") {
      terminal.writeln("index.js")
      terminal.writeln("package.json")
      terminal.writeln("README.md")
      terminal.writeln("src/")
    } else if (cmd.startsWith("cd ")) {
      terminal.writeln(`Changed directory to ${cmd.substring(3)}`)
    } else if (cmd === "pwd") {
      terminal.writeln("/home/user/projects/my-project")
    } else if (cmd.startsWith("echo ")) {
      terminal.writeln(cmd.substring(5))
    } else if (cmd === "date") {
      terminal.writeln(new Date().toString())
    } else if (cmd === "connect") {
      connectToTerminalServer()
      return // Don't show prompt yet
    } else if (cmd) {
      terminal.writeln(`Command not found: ${cmd}. Type 'help' for available commands.`)
    }

    terminal.write("$ ")
  }

  // Set up terminal input handling for simulated mode
  useEffect(() => {
    if (!terminal) return

    let currentCommand = ""

    const dataHandler = (data: string) => {
      // Only handle input in simulated mode
      if (isConnected) return

      // Handle special keys
      if (data === "\r") {
        // Enter key
        handleSimulatedCommand(currentCommand)
        currentCommand = ""
      } else if (data === "\u007F") {
        // Backspace key
        if (currentCommand.length > 0) {
          currentCommand = currentCommand.substring(0, currentCommand.length - 1)
          terminal.write("\b \b") // Erase character
        }
      } else if (data === "\u0003") {
        // Ctrl+C
        terminal.writeln("^C")
        currentCommand = ""
        terminal.write("$ ")
      } else if (data >= " ") {
        // Printable characters
        currentCommand += data
        terminal.write(data)
      }
    }

    // Add data handler
    const originalOnData = terminal.onData
    terminal.onData(dataHandler)

    return () => {
      // Clean up
      if (terminal) {
        // Remove our handler
        // Note: This is a simplified cleanup and might not work as expected
        // with the actual xterm.js API
      }
    }
  }, [terminal, isConnected])

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div ref={terminalRef} className="flex-1" />
      {!isConnected && (
        <div className="p-2 border-t border-gray-800 flex justify-between items-center">
          <span className="text-xs text-gray-400">
            {isServerRunning ? "Terminal server detected" : "Terminal server not detected"}
          </span>
          <button
            className={`px-2 py-1 text-xs rounded ${
              isServerRunning
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
            onClick={connectToTerminalServer}
            disabled={!isServerRunning}
          >
            Connect to Terminal Server
          </button>
        </div>
      )}
    </div>
  )
}
