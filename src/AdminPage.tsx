import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, GripVertical, Save,
  KeyRound, Eye, EyeOff, LayoutGrid, Pencil, X, Check,
  ShieldAlert, LogOut,
} from 'lucide-react'
import {
  saveApps, fetchApps, loadPin, savePin, generateId,
  isRemoteCatalog, upsertAppRemote, deleteAppRemote, saveOrderRemote,
  type AppEntry,
} from './storage'
import { useAuth } from './auth/AuthContext'

const GRADIENTS = [
  'from-indigo-500 to-purple-600',
  'from-teal-500 to-cyan-600',
  'from-emerald-500 to-green-600',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-sky-500 to-blue-600',
  'from-lime-500 to-emerald-600',
  'from-red-500 to-rose-600',
]

const EMPTY_FORM: Omit<AppEntry, 'id' | 'order'> = {
  name: '',
  description: '',
  url: '',
  route: '',
  icon: '🚀',
  color: GRADIENTS[0],
  status: 'live',
}

// ── PIN screen ────────────────────────────────────────────────────────────────

function PinScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState(false)
  const navigate = useNavigate()

  const submit = () => {
    if (pin === loadPin()) {
      onUnlock()
    } else {
      setError(true)
      setPin('')
      setTimeout(() => setError(false), 1200)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <LayoutGrid className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg tracking-tight">
            My Hub · Admin
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="w-4 h-4 text-zinc-400" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">PIN di accesso</span>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">PIN di default: 1234</p>

          <div className="relative mb-4">
            <input
              type={show ? 'text' : 'password'}
              value={pin}
              onChange={e => setPin(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="••••"
              className={[
                'w-full rounded-xl border px-4 py-3 pr-10 text-sm outline-none transition-colors',
                'bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100',
                'placeholder:text-zinc-400',
                error
                  ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-zinc-200 dark:border-zinc-700 focus:border-brand-400 dark:focus:border-brand-500',
              ].join(' ')}
              autoFocus
            />
            <button
              onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-500 mb-3 text-center">PIN non corretto</p>
          )}

          <button
            onClick={submit}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-xl py-3 text-sm font-medium transition-colors"
          >
            Accedi
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full mt-3 text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors py-1"
          >
            Torna al hub
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Schermata "non autorizzato" (loggato ma non admin) ─────────────────────────

function NotAdminScreen({ onSignOut }: { onSignOut: () => void }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Accesso riservato</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
          Questo account non ha i permessi di amministratore per gestire il catalogo.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
          >
            Torna all'hub
          </button>
          <button
            onClick={onSignOut}
            className="w-full inline-flex items-center justify-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 py-1"
          >
            <LogOut className="w-4 h-4" /> Esci
          </button>
        </div>
      </div>
    </div>
  )
}

// ── App form (add / edit) ─────────────────────────────────────────────────────

function AppForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<AppEntry, 'id' | 'order'>
  onSave: (data: Omit<AppEntry, 'id' | 'order'>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState(initial)
  // Tipo app: interna (montata nella shell via route) o esterna (link in nuovo tab).
  const [kind, setKind] = useState<'internal' | 'external'>(
    initial.route?.trim() ? 'internal' : 'external',
  )
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const isInternal = kind === 'internal'
  const valid = Boolean(
    form.name.trim() && (isInternal ? form.route?.trim() : form.url.trim()),
  )

  // Salva normalizzando: un'app interna non ha url, una esterna non ha route.
  const handleSave = () => {
    if (!valid) return
    onSave(
      isInternal
        ? { ...form, route: form.route?.trim(), url: '' }
        : { ...form, url: form.url.trim(), route: '' },
    )
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
      {/* Preview band */}
      <div className={`h-2 rounded-full bg-gradient-to-r ${form.color}`} />

      {/* Tipo app */}
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Tipo</label>
        <div className="inline-flex rounded-xl border border-zinc-200 dark:border-zinc-700 p-0.5 bg-zinc-50 dark:bg-zinc-800">
          {(['internal', 'external'] as const).map(k => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={[
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                kind === k
                  ? 'bg-brand-600 text-white'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200',
              ].join(' ')}
            >
              {k === 'internal' ? 'Interna' : 'Esterna'}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-400 mt-1.5">
          {isInternal
            ? 'Montata dentro l’hub a una route (es. /app/paystats).'
            : 'Aperta in un nuovo tab tramite URL esterno.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nome */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Nome *</label>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Es. PayStats"
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-400 dark:focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Icona */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Icona (emoji)</label>
          <input
            value={form.icon}
            onChange={e => set('icon', e.target.value)}
            placeholder="💰"
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-400 dark:focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Route (interna) o URL (esterna) */}
        {isInternal ? (
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Route *</label>
            <input
              value={form.route ?? ''}
              onChange={e => set('route', e.target.value)}
              placeholder="/app/paystats"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-400 dark:focus:border-brand-500 transition-colors"
            />
          </div>
        ) : (
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">URL *</label>
            <input
              value={form.url}
              onChange={e => set('url', e.target.value)}
              placeholder="https://mia-app.vercel.app"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-400 dark:focus:border-brand-500 transition-colors"
            />
          </div>
        )}

        {/* Descrizione */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Descrizione</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Breve descrizione di cosa fa l'app..."
            rows={2}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-400 dark:focus:border-brand-500 transition-colors resize-none"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Stato</label>
          <select
            value={form.status}
            onChange={e => set('status', e.target.value)}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-400 dark:focus:border-brand-500 transition-colors"
          >
            <option value="live">Live</option>
            <option value="wip">In corso</option>
            <option value="planned">Pianificata</option>
          </select>
        </div>

        {/* Gradiente */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Colore</label>
          <div className="flex flex-wrap gap-2">
            {GRADIENTS.map(g => (
              <button
                key={g}
                onClick={() => set('color', g)}
                className={[
                  `w-7 h-7 rounded-lg bg-gradient-to-r ${g} transition-all`,
                  form.color === g ? 'ring-2 ring-offset-2 ring-brand-500 scale-110' : 'opacity-70 hover:opacity-100',
                ].join(' ')}
                title={g}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" /> Annulla
        </button>
        <button
          onClick={handleSave}
          disabled={!valid}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors"
        >
          <Check className="w-3.5 h-3.5" /> Salva
        </button>
      </div>
    </div>
  )
}

// ── Admin page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { configured, loading, user, isAdmin, signOut } = useAuth()
  const [unlocked, setUnlocked] = useState(false)
  const [apps, setApps] = useState<AppEntry[]>([])
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [changingPin, setChangingPin] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [pinSaved, setPinSaved] = useState(false)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // Accesso: con Supabase serve l'admin loggato; in demo basta il PIN.
  const authorized = configured ? Boolean(user && isAdmin) : unlocked

  useEffect(() => {
    if (authorized) fetchApps().then(setApps)
  }, [authorized])

  // Esegue una mutazione remota (se catalogo Supabase) gestendo gli errori:
  // in caso di errore ripristina dal server e mostra un messaggio.
  const runRemote = async (op: () => Promise<{ error: string | null }>) => {
    if (!isRemoteCatalog) return
    const { error: err } = await op()
    if (err) {
      setError(err)
      fetchApps().then(setApps)
    } else {
      setError(null)
    }
  }

  // Aggiorna stato + cache locale; se remoto, lancia anche la mutazione su Supabase.
  const persistLocal = (next: AppEntry[]) => {
    setApps(next)
    saveApps(next)
  }

  const addApp = (data: Omit<AppEntry, 'id' | 'order'>) => {
    const entry: AppEntry = { ...data, id: generateId(), order: apps.length }
    persistLocal([...apps, entry])
    setAdding(false)
    void runRemote(() => upsertAppRemote(entry))
  }

  const updateApp = (id: string, data: Omit<AppEntry, 'id' | 'order'>) => {
    const next = apps.map(a => (a.id === id ? { ...a, ...data } : a))
    persistLocal(next)
    setEditingId(null)
    const updated = next.find(a => a.id === id)
    if (updated) void runRemote(() => upsertAppRemote(updated))
  }

  const deleteApp = (id: string) => {
    persistLocal(apps.filter(a => a.id !== id))
    void runRemote(() => deleteAppRemote(id))
  }

  // Drag-and-drop reorder
  const onDragStart = (id: string) => setDragging(id)
  const onDragEnd = () => { setDragging(null); setDragOver(null) }
  const onDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    setDragOver(id)
  }
  const onDrop = (targetId: string) => {
    if (!dragging || dragging === targetId) return
    const from = apps.findIndex(a => a.id === dragging)
    const to = apps.findIndex(a => a.id === targetId)
    const next = [...apps]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    const reordered = next.map((a, i) => ({ ...a, order: i }))
    persistLocal(reordered)
    setDragging(null)
    setDragOver(null)
    void runRemote(() => saveOrderRemote(reordered))
  }

  const handleSavePin = () => {
    if (newPin.trim().length < 4) return
    savePin(newPin.trim())
    setNewPin('')
    setChangingPin(false)
    setPinSaved(true)
    setTimeout(() => setPinSaved(false), 2000)
  }

  // ── Gating accesso ──────────────────────────────────────────────────────────
  if (configured) {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <div className="text-sm text-zinc-400">Caricamento…</div>
        </div>
      )
    }
    if (!user) return <Navigate to="/login" state={{ from: '/admin' }} replace />
    if (!isAdmin) return <NotAdminScreen onSignOut={async () => { await signOut(); navigate('/') }} />
  } else if (!unlocked) {
    return <PinScreen onUnlock={() => setUnlocked(true)} />
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            {configured && (
              <button
                onClick={async () => { await signOut(); navigate('/') }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Esci"
              >
                <LogOut className="w-3.5 h-3.5" /> Esci
              </button>
            )}
            <button
              onClick={() => { setAdding(true); setEditingId(null) }}
              disabled={adding}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Nuova app
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Banner errore catalogo */}
        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-start justify-between gap-2">
            <span>Errore salvataggio: {error}</span>
            <button onClick={() => setError(null)} className="underline underline-offset-2 hover:no-underline shrink-0">Ok</button>
          </div>
        )}

        {/* Add form */}
        {adding && (
          <section>
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
              Nuova app
            </h2>
            <AppForm
              initial={EMPTY_FORM}
              onSave={addApp}
              onCancel={() => setAdding(false)}
            />
          </section>
        )}

        {/* Apps list */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
            App ({apps.length})
          </h2>

          {apps.length === 0 && !adding && (
            <p className="text-sm text-zinc-400 dark:text-zinc-600 text-center py-10">
              Nessuna app. Clicca "Nuova app" per iniziare.
            </p>
          )}

          <div className="space-y-3">
            {apps.map(app => (
              <div
                key={app.id}
                draggable
                onDragStart={() => onDragStart(app.id)}
                onDragEnd={onDragEnd}
                onDragOver={e => onDragOver(e, app.id)}
                onDrop={() => onDrop(app.id)}
                className={[
                  'transition-all duration-150',
                  dragOver === app.id && dragging !== app.id ? 'scale-[1.02] opacity-80' : '',
                  dragging === app.id ? 'opacity-40' : '',
                ].join(' ')}
              >
                {editingId === app.id ? (
                  <AppForm
                    initial={{ name: app.name, description: app.description, url: app.url, route: app.route ?? '', icon: app.icon, color: app.color, status: app.status }}
                    onSave={data => updateApp(app.id, data)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex items-center gap-3 pr-3">
                    <div className={`w-1.5 self-stretch bg-gradient-to-b ${app.color} flex-shrink-0`} />
                    <div className="w-8 flex-shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing text-zinc-300 dark:text-zinc-600">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <span className="text-xl py-4">{app.icon}</span>
                    <div className="flex-1 min-w-0 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{app.name}</span>
                        <span className={[
                          'text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0',
                          app.status === 'live' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                          app.status === 'wip'  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                                                   'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
                        ].join(' ')}>
                          {app.status === 'live' ? 'Live' : app.status === 'wip' ? 'In corso' : 'Pianificata'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                        {app.route ? `↪ ${app.route}` : app.url}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setEditingId(app.id); setAdding(false) }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteApp(app.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* PIN settings — solo in modalità demo (senza Supabase) */}
        {!configured && (
        <section className="border-t border-zinc-200 dark:border-zinc-800 pt-8">
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
            Sicurezza
          </h2>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">PIN di accesso</p>
                <p className="text-xs text-zinc-400 mt-0.5">Minimo 4 caratteri</p>
              </div>
              {pinSaved ? (
                <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                  <Check className="w-3.5 h-3.5" /> Salvato
                </span>
              ) : (
                <button
                  onClick={() => setChangingPin(c => !c)}
                  className="text-sm text-brand-600 dark:text-brand-400 hover:underline font-medium"
                >
                  {changingPin ? 'Annulla' : 'Cambia PIN'}
                </button>
              )}
            </div>

            {changingPin && (
              <div className="mt-4 flex gap-2">
                <input
                  type="password"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSavePin()}
                  placeholder="Nuovo PIN"
                  className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-400 transition-colors"
                  autoFocus
                />
                <button
                  onClick={handleSavePin}
                  disabled={newPin.trim().length < 4}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white text-sm font-medium transition-colors"
                >
                  <Save className="w-3.5 h-3.5" /> Salva
                </button>
              </div>
            )}
          </div>
        </section>
        )}
      </main>
    </div>
  )
}
