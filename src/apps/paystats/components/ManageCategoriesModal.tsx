import { useState } from 'react'
import { X, Plus, Trash2, Pencil, Check } from 'lucide-react'
import type { Category } from '../types'
import { useToast } from '../context/ToastContext'
import { BottomSheet } from './BottomSheet'
import { EmojiPicker } from './EmojiPicker'

const PALETTE = [
  '#f97316','#eab308','#22c55e','#14b8a6',
  '#3b82f6','#6366f1','#a855f7','#ec4899',
  '#ef4444','#64748b',
]
const DEFAULT_ICON = '🍔'

interface Props {
  categories: Category[]
  onAdd: (c: Omit<Category, 'id'>) => void
  onUpdate: (id: string, patch: Partial<Omit<Category, 'id'>>) => void
  onDelete: (id: string) => void
  onClose: () => void
}

interface FormState { name: string; color: string; icon: string; budget: string }

interface FormProps {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  onSubmit: () => void
  onCancel: () => void
  submitLabel: string
}

function CategoryForm({ form, setForm, onSubmit, onCancel, submitLabel }: FormProps) {
  return (
    <div className="space-y-4 w-full">
      <input
        className="input"
        placeholder="Nome categoria"
        value={form.name}
        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        autoFocus
      />
      <div>
        <p className="label">Icona</p>
        <div className="flex items-center gap-3">
          <EmojiPicker value={form.icon} onChange={ic => setForm(f => ({ ...f, icon: ic }))} />
          <span className="text-xs text-surface-400 dark:text-surface-500">
            Tocca per scegliere un'emoji
          </span>
        </div>
      </div>
      <div>
        <p className="label">Colore</p>
        <div className="flex flex-wrap gap-2.5 items-center">
          {PALETTE.map(col => (
            <button key={col} type="button"
              onClick={() => setForm(f => ({ ...f, color: col }))}
              className="w-8 h-8 rounded-full transition-transform hover:scale-110 active:scale-95"
              style={{ backgroundColor: col, outline: form.color === col ? `3px solid ${col}` : 'none', outlineOffset: '3px' }}
            />
          ))}
          {/* Separatore + color picker libero */}
          <div className="w-px h-6 bg-surface-200 dark:bg-surface-600 mx-1" />
          <label
            className="relative w-8 h-8 rounded-full cursor-pointer hover:scale-110 active:scale-95 transition-transform overflow-hidden flex-shrink-0"
            title="Colore personalizzato"
            style={{ backgroundColor: PALETTE.includes(form.color) ? '#e2e8f0' : form.color,
                     outline: !PALETTE.includes(form.color) ? `3px solid ${form.color}` : 'none',
                     outlineOffset: '3px' }}
          >
            {PALETTE.includes(form.color) && (
              <span className="absolute inset-0 flex items-center justify-center text-surface-400 text-xs font-bold pointer-events-none">
                +
              </span>
            )}
            <input
              type="color"
              className="absolute opacity-0 w-full h-full cursor-pointer"
              value={form.color}
              onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
            />
          </label>
        </div>
      </div>
      <div>
        <p className="label">Budget mensile (€) — opzionale</p>
        <input
          className="input"
          type="number"
          min="0"
          step="10"
          placeholder="Es. 200"
          value={form.budget}
          onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" className="btn-secondary flex-1 justify-center" onClick={onCancel}>Annulla</button>
        <button type="button" className="btn-primary flex-1 justify-center" onClick={onSubmit}>
          <Check size={15} /> {submitLabel}
        </button>
      </div>
    </div>
  )
}

const BLANK: FormState = { name: '', color: PALETTE[0], icon: DEFAULT_ICON, budget: '' }

export function ManageCategoriesModal({ categories, onAdd, onUpdate, onDelete, onClose }: Props) {
  const { toast } = useToast()
  const [editing, setEditing] = useState<string | null>(null)
  const [adding,  setAdding]  = useState(false)
  const [form,    setForm]    = useState<FormState>(BLANK)

  function startAdd() { setForm(BLANK); setAdding(true); setEditing(null) }
  function startEdit(cat: Category) {
    setForm({ name: cat.name, color: cat.color, icon: cat.icon, budget: cat.budget !== undefined ? String(cat.budget) : '' })
    setEditing(cat.id); setAdding(false)
  }
  function cancelForm() { setAdding(false); setEditing(null) }

  function parseBudget(): number | undefined {
    const v = parseFloat(form.budget)
    return isNaN(v) || v <= 0 ? undefined : v
  }

  function submitAdd() {
    if (!form.name.trim()) { toast.error('Inserisci un nome per la categoria.', 'Nome mancante'); return }
    if (categories.some(c => c.name.toLowerCase() === form.name.trim().toLowerCase())) {
      toast.warning(`Esiste già una categoria "${form.name.trim()}".`, 'Nome duplicato'); return
    }
    try {
      onAdd({ name: form.name.trim(), color: form.color, icon: form.icon, budget: parseBudget() })
      toast.success(`Categoria "${form.name.trim()}" creata.`, 'Categoria aggiunta')
      setAdding(false)
    } catch { toast.error('Impossibile creare la categoria. Riprova.', 'Errore') }
  }

  function submitEdit() {
    if (!editing) return
    if (!form.name.trim()) { toast.error('Il nome non può essere vuoto.', 'Nome mancante'); return }
    if (categories.some(c => c.id !== editing && c.name.toLowerCase() === form.name.trim().toLowerCase())) {
      toast.warning(`Esiste già una categoria "${form.name.trim()}".`, 'Nome duplicato'); return
    }
    try {
      onUpdate(editing, { name: form.name.trim(), color: form.color, icon: form.icon, budget: parseBudget() })
      toast.success('Categoria aggiornata.', 'Modifica salvata')
      setEditing(null)
    } catch { toast.error('Impossibile aggiornare la categoria.', 'Errore') }
  }

  function handleDelete(cat: Category) {
    try {
      onDelete(cat.id)
      toast.info(`Categoria "${cat.name}" eliminata.`, 'Rimossa')
    } catch { toast.error('Impossibile eliminare la categoria.', 'Errore') }
  }

  const showForm = adding || editing !== null

  return (
    <BottomSheet onClose={onClose} desktopMaxW="sm:max-w-lg">
      <div className="flex items-center justify-between px-6 pt-4 sm:pt-6 pb-4 border-b border-surface-100 dark:border-surface-700 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">Categorie</h2>
          <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">
            {categories.length} {categories.length === 1 ? 'categoria' : 'categorie'}
          </p>
        </div>
        <button className="btn-ghost p-1.5" onClick={onClose} aria-label="Chiudi"><X size={18} /></button>
      </div>

      <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
        {categories.map(cat => (
          <div key={cat.id}
            className="group flex items-center gap-3 p-3 rounded-2xl border border-surface-100 dark:border-surface-700 hover:border-surface-200 dark:hover:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-all"
          >
            {editing === cat.id ? (
              <CategoryForm form={form} setForm={setForm} onSubmit={submitEdit} onCancel={cancelForm} submitLabel="Salva" />
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ backgroundColor: `${cat.color}22` }}>
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-surface-800 dark:text-surface-200 text-sm block">{cat.name}</span>
                  {cat.budget && (
                    <span className="text-[10px] text-surface-400 dark:text-surface-500">Budget: €{cat.budget}/mese</span>
                  )}
                </div>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button className="btn-ghost p-2" onClick={() => startEdit(cat)} aria-label="Modifica"><Pencil size={15} /></button>
                  <button className="btn-danger p-2" onClick={() => handleDelete(cat)} aria-label="Elimina"><Trash2 size={15} /></button>
                </div>
              </>
            )}
          </div>
        ))}

        {adding && (
          <div className="p-4 rounded-2xl border-2 border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-900/20">
            <p className="text-sm font-semibold text-brand-700 dark:text-brand-400 mb-3">Nuova categoria</p>
            <CategoryForm form={form} setForm={setForm} onSubmit={submitAdd} onCancel={cancelForm} submitLabel="Crea" />
          </div>
        )}
      </div>

      {!showForm && (
        <div className="px-4 py-4 border-t border-surface-100 dark:border-surface-700 flex-shrink-0">
          <button className="btn-primary w-full justify-center" onClick={startAdd}>
            <Plus size={16} /> Nuova categoria
          </button>
        </div>
      )}
    </BottomSheet>
  )
}
