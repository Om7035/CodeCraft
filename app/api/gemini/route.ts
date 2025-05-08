import { type NextRequest, NextResponse } from "next/server"
import { GeminiAPI, type GeminiMessage } from "@/lib/gemini-api"

export async function POST(req: NextRequest) {
  try {
    const { messages, code, currentFile } = await req.json()

    // Get API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY

    // Initialize Gemini API
    const gemini = new GeminiAPI(apiKey)

    // Format messages for Gemini API
    const formattedMessages: GeminiMessage[] = []

    // Add system message with code context
    const systemPrompt = `You are an AI coding assistant in the CodeCraft IDE. 
You help developers write, debug, and improve their code.
${currentFile ? `\nThe user is currently working on the file: ${currentFile}` : ""}
${code ? `\nHere is the code the user is working on:\n\`\`\`\n${code}\n\`\`\`` : ""}

You can help with:
1. Explaining code
2. Finding and fixing errors
3. Suggesting improvements
4. Generating code snippets
5. Answering programming questions

You can also help with file operations by responding to requests like:
- "Create a new file called example.js with content..."
- "Update this file with the following code..."
- "Delete the file called example.js"

Please be concise, helpful, and provide code examples when appropriate.`

    formattedMessages.push({
      role: "user",
      parts: [{ text: systemPrompt }],
    })

    // Add model response to acknowledge the system message
    formattedMessages.push({
      role: "model",
      parts: [{ text: "I understand. I'll help you with your code and file operations. What would you like to do?" }],
    })

    // Add user messages
    for (const message of messages) {
      formattedMessages.push({
        role: message.role === "user" ? "user" : "model",
        parts: [{ text: message.content }],
      })
    }

    // Generate response
    const response = await gemini.generateResponse(formattedMessages)

    // Return the response
    return NextResponse.json({ response })
  } catch (error) {
    console.error("Error in Gemini API route:", error)
    return NextResponse.json({ error: "Failed to process your request" }, { status: 500 })
  }
}
