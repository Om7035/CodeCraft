import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

export async function POST(req: Request) {
  const { messages, code } = await req.json()

  // Add the code context to the system message
  const systemMessage = `You are an AI coding assistant in the CodeCraft IDE. 
You help developers write, debug, and improve their code.
${code ? `\nThe user is currently working on this code:\n\`\`\`\n${code}\n\`\`\`` : ""}
Be concise, helpful, and provide code examples when appropriate.`

  try {
    const result = streamText({
      model: openai("gpt-4o"),
      messages,
      system: systemMessage,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error calling AI service:", error)
    return new Response(JSON.stringify({ error: "Failed to process your request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
