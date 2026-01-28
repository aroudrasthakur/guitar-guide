import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Guitar Guide
        </h1>
        <p className="text-center mb-8 text-lg">
          Learn guitar chords with real-time AR feedback
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/onboarding"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </main>
  )
}
