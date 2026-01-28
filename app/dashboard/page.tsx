import Link from 'next/link'

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Guitar Guide</h1>
            <p className="mt-1 text-sm text-slate-400">
              Your practice hub for chords, transitions, and calibration.
            </p>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/onboarding"
              className="rounded-full border border-slate-700 px-4 py-2 text-slate-200 hover:border-slate-500 hover:bg-slate-900 transition-colors"
            >
              Onboarding
            </Link>
            <button className="rounded-full border border-slate-700 px-4 py-2 text-slate-300 hover:border-red-500/70 hover:bg-red-500/10 transition-colors">
              Logout
            </button>
          </nav>
        </header>

        <section className="grid gap-6 md:grid-cols-[2fr,1.5fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-black/40">
              <h2 className="text-xl font-semibold mb-1">Today&apos;s Focus</h2>
              <p className="text-sm text-slate-400 mb-4">
                Jump back into your last session or choose a new focus area.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Link
                  href="/practice/chords"
                  className="group rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 hover:border-emerald-400 hover:bg-emerald-500/15 transition-colors"
                >
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-emerald-300">
                    Chords
                  </div>
                  <div className="text-sm font-semibold">Chord Practice</div>
                  <p className="mt-1 text-xs text-emerald-100/80">
                    Drill individual chords with real-time feedback.
                  </p>
                </Link>

                <Link
                  href="/practice/transitions"
                  className="group rounded-xl border border-sky-500/40 bg-sky-500/10 p-4 hover:border-sky-400 hover:bg-sky-500/15 transition-colors"
                >
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-sky-300">
                    Transitions
                  </div>
                  <div className="text-sm font-semibold">Chord Transitions</div>
                  <p className="mt-1 text-xs text-sky-100/80">
                    Smoothly move between chords at tempo.
                  </p>
                </Link>

                <Link
                  href="/calibrate"
                  className="group rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 hover:border-amber-400 hover:bg-amber-500/15 transition-colors"
                >
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-amber-300">
                    Setup
                  </div>
                  <div className="text-sm font-semibold">Calibrate Guitar</div>
                  <p className="mt-1 text-xs text-amber-100/80">
                    Recalibrate fretboard and camera alignment.
                  </p>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-lg font-semibold mb-1">Progress Overview</h2>
              <p className="text-sm text-slate-400 mb-4">
                This is placeholder data — hook this up to real stats once tracking is implemented.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Sessions</div>
                  <div className="mt-2 text-2xl font-semibold">12</div>
                  <div className="mt-1 text-xs text-emerald-400">+3 this week</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Accuracy</div>
                  <div className="mt-2 text-2xl font-semibold">82%</div>
                  <div className="mt-1 text-xs text-sky-400">Avg. chord match</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Time Played</div>
                  <div className="mt-2 text-2xl font-semibold">4.5h</div>
                  <div className="mt-1 text-xs text-amber-400">Last 7 days</div>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="text-sm font-semibold mb-2">Quick Tips</h2>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>• Make sure your guitar and hands are fully visible to the camera.</li>
                <li>• Use the calibration flow whenever you change your camera angle.</li>
                <li>• Start slow with transitions, then increase the tempo gradually.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="text-sm font-semibold mb-2">Next Up</h2>
              <p className="text-xs text-slate-300 mb-3">
                After you implement authentication, redirect users here after a successful login.
              </p>
              <p className="text-[11px] text-slate-500">
                Suggested route: <code className="rounded bg-slate-800 px-1 py-0.5 text-[11px]">/dashboard</code>
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}

