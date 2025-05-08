import type React from "react"
import Link from "next/link"
import { ArrowRight, Code, Cpu, Layers, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Code className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-bold">CodeCraft</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="hover:text-blue-400 transition">
              Features
            </Link>
            <Link href="#ai" className="hover:text-blue-400 transition">
              AI Integration
            </Link>
            <Link href="#languages" className="hover:text-blue-400 transition">
              Languages
            </Link>
          </nav>
          <div>
            <Button asChild variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-950">
              <Link href="/editor">Launch IDE</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          The <span className="text-blue-500">AI-Powered</span> IDE of the Future
        </h1>
        <p className="text-xl text-gray-400 max-w-3xl mb-8">
          CodeCraft combines powerful editing capabilities with advanced AI to help you build applications in multiple
          languages faster than ever before.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Link href="/editor">
              Try CodeCraft Now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="#features">Learn More</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Cpu className="h-10 w-10 text-blue-500" />}
              title="Intelligent Code Completion"
              description="Advanced AI-powered code completion that understands context and suggests relevant code snippets."
            />
            <FeatureCard
              icon={<Layers className="h-10 w-10 text-blue-500" />}
              title="Multi-Language Support"
              description="Support for over 40 programming languages with specialized AI assistance for each one."
            />
            <FeatureCard
              icon={<Sparkles className="h-10 w-10 text-blue-500" />}
              title="Real-time Collaboration"
              description="Work together with your team in real-time with built-in collaboration features."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>© 2025 CodeCraft. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}
