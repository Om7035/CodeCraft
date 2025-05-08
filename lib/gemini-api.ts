// Gemini API integration for AI assistant

export interface GeminiMessage {
  role: "user" | "model"
  parts: {
    text: string
  }[]
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string
      }[]
    }
    finishReason: string
  }[]
}

export class GeminiAPI {
  private apiKey: string
  private model: string
  private apiUrl: string

  constructor(apiKey: string, model = "gemini-pro") {
    this.apiKey = apiKey
    this.model = model
    this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  }

  // Generate a response from the Gemini API
  public async generateResponse(messages: GeminiMessage[]): Promise<string> {
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Gemini API error: ${response.status} ${errorText}`)
      }

      const data: GeminiResponse = await response.json()

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No response from Gemini API")
      }

      return data.candidates[0].content.parts[0].text
    } catch (error) {
      console.error("Error generating response from Gemini API:", error)
      return "Sorry, I encountered an error while processing your request."
    }
  }

  // Stream a response from the Gemini API (note: Gemini doesn't support streaming directly like OpenAI)
  // This is a simulated streaming implementation
  public async streamResponse(
    messages: GeminiMessage[],
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: string) => void,
  ): Promise<void> {
    try {
      // Get the full response
      const fullResponse = await this.generateResponse(messages)

      // Simulate streaming by sending chunks of the response
      const chunks = this.chunkString(fullResponse, 10)

      for (const chunk of chunks) {
        onChunk(chunk)
        // Add a small delay to simulate streaming
        await new Promise((resolve) => setTimeout(resolve, 10))
      }

      onComplete(fullResponse)
    } catch (error) {
      console.error("Error streaming response from Gemini API:", error)
      onChunk("Sorry, I encountered an error while processing your request.")
      onComplete("Sorry, I encountered an error while processing your request.")
    }
  }

  // Helper function to chunk a string into smaller pieces
  private chunkString(str: string, size: number): string[] {
    const chunks = []
    let i = 0

    while (i < str.length) {
      // Find the nearest space to avoid breaking words
      let end = Math.min(i + size, str.length)
      if (end < str.length) {
        while (end > i && str[end] !== " ") {
          end--
        }
        if (end === i) {
          // If no space found, just cut at the size
          end = i + size
        }
      }

      chunks.push(str.substring(i, end))
      i = end + 1
    }

    return chunks
  }
}
