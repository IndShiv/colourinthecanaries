import { useState } from 'react'
import clsx from 'clsx'
import { PracticePage } from './pages/PracticePage'
import { ProgressPage } from './pages/ProgressPage'

type View = 'practice' | 'progress'

function App() {
  const [view, setView] = useState<View>('practice')

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐤</span>
            <div>
              <h1 className="text-base font-bold text-slate-800">Colouring the Canaries</h1>
              <p className="text-xs text-slate-400">Interproximal caries diagnosis practice for dental students</p>
            </div>
          </div>
          <nav className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm">
            <NavButton active={view === 'practice'} onClick={() => setView('practice')}>
              Practice
            </NavButton>
            <NavButton active={view === 'progress'} onClick={() => setView('progress')}>
              Progress
            </NavButton>
          </nav>
        </div>
      </header>

      <main>{view === 'practice' ? <PracticePage /> : <ProgressPage />}</main>
    </div>
  )
}

function NavButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'rounded-md px-3 py-1.5 font-medium transition',
        active ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
      )}
    >
      {children}
    </button>
  )
}

export default App
