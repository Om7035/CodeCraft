"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
}

export default function CodeEditor({ value, onChange, language = "javascript" }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [editor, setEditor] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let monacoInstance: any = null
    let editorInstance: any = null

    const initMonaco = async () => {
      if (!editorRef.current) return

      try {
        // Dynamically import Monaco Editor
        const monaco = await import("monaco-editor")
        monacoInstance = monaco
        // Make monaco available globally
        window.monaco = monaco

        // Configure Monaco with VS Code-like settings
        monaco.editor.defineTheme("codecraft-dark", {
          base: "vs-dark",
          inherit: true,
          rules: [],
          colors: {
            "editor.background": "#1e1e2e",
            "editor.foreground": "#f8f8f2",
            "editorCursor.foreground": "#f8f8f2",
            "editor.lineHighlightBackground": "#2a2a3c",
            "editorLineNumber.foreground": "#565869",
            "editor.selectionBackground": "#44475a",
            "editor.inactiveSelectionBackground": "#3a3a4a",
          },
        })

        // Create or update the editor model with a valid URI
        const modelUri = monaco.Uri.parse("file:///" + ((window as any).currentFilePath || "untitled"));
        let model = monaco.editor.getModel(modelUri);
        if (!model) {
          model = monaco.editor.createModel(value, language, modelUri);
        }
        // Create editor instance
        const editor = monaco.editor.create(editorRef.current, {
          model,
          theme: "codecraft-dark",
          automaticLayout: true,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          fontSize: 14,
          fontFamily: '"JetBrains Mono", Menlo, Monaco, Consolas, monospace',
          tabSize: 2,
          wordWrap: "on",
          lineNumbers: "on",
          glyphMargin: true,
          folding: true,
          foldingStrategy: "auto",
          formatOnType: true,
          formatOnPaste: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: "on",
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          renderWhitespace: "selection",
          renderControlCharacters: true,
          renderLineHighlight: "all",
        })

        // Handle content changes
        editor.onDidChangeModelContent(() => {
          onChange(editor.getValue())
        })

        editorInstance = editor
        setEditor(editor)
        setLoading(false)
      } catch (error) {
        console.error("Failed to initialize Monaco editor:", error)
        setLoading(false)
      }
    }

    // Initialize Monaco Editor
    const timer = setTimeout(() => {
      initMonaco()
    }, 100)

    return () => {
      clearTimeout(timer)
      if (editorInstance) {
        editorInstance.dispose()
      }
    }
  }, [])

  // Update editor value when prop changes
  useEffect(() => {
    if (editor) {
      const model = editor.getModel();
      if (model && model.getValue() !== value) {
        model.setValue(value);
      }
    }
  }, [value, editor]);

  // Update language when prop changes
  useEffect(() => {
    if (editor) {
      const model = editor.getModel();
      if (model) {
        if (window.monaco) {
          window.monaco.editor.setModelLanguage(model, language);
        }
      }
    }
  }, [language, editor]);

  return (
    <div className="h-full w-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950 bg-opacity-70 z-10">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      )}
      <div ref={editorRef} className="h-full w-full" />
    </div>
  )
}
