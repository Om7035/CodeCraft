"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Sparkles, Copy, FileCode } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AIFileOperationsService } from "@/lib/ai-file-operations"

interface AIAssistantProps {
  code: string
  currentFile: string
  currentDirectory: string
  fileOperationsService: any
  onRefreshFileExplorer: () => void
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  isFileOperation?: boolean
}

export default function AIAssistant({
  code,
  currentFile,
  currentDirectory,
  fileOperationsService,
  onRefreshFileExplorer,
}: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm your AI coding assistant powered by Google Gemini. I can help with code completion, explanations, debugging, and file operations. Try asking me to create, update, or delete files!",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const aiFileOperations = useRef<AIFileOperationsService | null>(null)

  // Initialize AI file operations service
  useEffect(() => {
    if (fileOperationsService) {
      aiFileOperations.current = new AIFileOperationsService(fileOperationsService)
    }
  }, [fileOperationsService])

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // First check if this is a file operation request
      if (aiFileOperations.current) {
        const { response, operationPerformed } = await aiFileOperations.current.processMessage(
          input,
          currentFile,
          currentDirectory,
        )

        if (operationPerformed) {
          // If a file operation was performed, add the response as an assistant message
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: response,
            isFileOperation: true,
          }
          setMessages((prev) => [...prev, assistantMessage])

          // Refresh the file explorer
          onRefreshFileExplorer()

          setIsLoading(false)
          return
        } else if (response) {
          // If there was a response but no operation was performed, add it as an assistant message
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: response,
          }
          setMessages((prev) => [...prev, assistantMessage])
          setIsLoading(false)
          return
        }
      }

      // If not a file operation or no response, call Gemini API
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(({ role, content }) => ({
            role: role === "assistant" ? "model" : "user",
            content,
          })),
          code,
          currentFile,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error calling Gemini API:", error)
      toast({
        title: "Error",
        description: "Failed to get a response from the AI assistant.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "The message has been copied to your clipboard.",
    })
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`group ${
              message.role === "user" ? "bg-blue-900 ml-4" : "bg-gray-800 mr-4"
            } p-3 rounded-lg relative`}
          >
            <div className="whitespace-pre-wrap">{message.content}</div>
            {message.role === "assistant" && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                {message.isFileOperation && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={onRefreshFileExplorer}
                    title="Refresh file explorer"
                  >
                    <FileCode className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(message.content)}
                  title="Copy to clipboard"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-2" />
            <span className="text-sm text-gray-400">AI is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!isLoading && (
        <div className="p-2 border-t border-gray-800">
          <div className="flex flex-wrap gap-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => handleSuggestion("Explain this code to me")}
            >
              Explain code
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => handleSuggestion("Find errors in my code")}
            >
              Find errors
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => handleSuggestion("Create a new file called example.js with a simple function")}
            >
              Create file
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-2 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the AI assistant or request file operations..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="h-10 w-10 shrink-0">
            <Sparkles className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
