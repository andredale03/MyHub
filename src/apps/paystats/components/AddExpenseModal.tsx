import { useState } from 'react'
import { X } from 'lucide-react'
import type { Category, Expense } from '../types'
import { useToast } from '../context/ToastContext'
import { BottomSheet } from './BottomSheet'
import { currencySymbol } from '../format'

interface ExpenseInput { amount: number; description: string; categoryId: string; date: string }

interface Props {
  categories: Category[]
  /** Se presente, il modale è in modalità modifica. */
  initial?: Expense | null
  currency?: string
  onAdd: (exp: ExpenseInput) => void
  onUpdate?: (id: string, patch: ExpenseInput) => void
  onClose: () => void
}

export function AddExpenseModal({ categories, initial, currency = 'EUR', onAdd, onUpdate, onClose }: Props) {
  const { toast } = useToast()
  const today = new Date().toISOString().split('T')[0]
  const isEdit = Boolean(initial)
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? '')
  const [date, setDate] = useState(initial?.date ?? today)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(amount.replace(',', '.'))
    if (isNaN(parsed) || parsed <= 0) {
      toast.error('Inserisci un importo valido maggiore di zero.', 'Importo non valido')
      return
    }
    if (!categoryId) {
      toast.error('Seleziona una categoria prima di procedere.', 'Categoria mancante')
      return
    }
    if (!date) {
      toast.error('Seleziona una data per la spesa.', 'Data mancante')
      return
    }
    try {
      const data = { amount: parsed, description: description.trim(), categoryId, date }
      if (isEdit && initial && onUpdate) {
        onUpdate(initial.id, data)
        toast.success('Spesa aggiornata correttamente.', 'Spesa salvata')
      } else {
        onAdd(data)
        toast.success('Spesa aggiunta correttamente.', 'Spesa salvata')
      }
      onClose()
    } catch {
      toast.error('Impossibile salvare la spesa. Riprova.', 'Errore di salvataggio')
    }
  }

  return (
    <BottomSheet onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-4 sm:pt-6 pb-4 border-b border-surface-100 dark:border-surface-700 flex-shrink-0">
        <h2 className="text-lg font-bold text-surface-900 dark:text-surface-50">{isEdit ? 'Modifica spesa' : 'Nuova spesa'}</h2>
        <button className="btn-ghost p-1.5" onClick={onClose} aria-label="Chiudi">
          <X size={18} />
        </button>
      </div>

      {/* Form scrollabile */}
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          <div>
            <label className="label">Importo ({currencySymbol(currency)})</label>
            <input
              className="input text-2xl font-bold"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="label">Descrizione</label>
            <input
              className="input"
              type="text"
              placeholder="Es. Pranzo al bar…"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Categoria</label>
            {categories.length === 0 ? (
              <p className="text-sm text-surface-400 dark:text-surface-500 italic">
                Nessuna categoria — creane una prima dalla tab Categorie.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`chip ${categoryId === cat.id ? 'chip-active' : 'chip-inactive'}`}
                    style={categoryId === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="label">Data</label>
            <input
              className="input"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

        </div>

        {/* Footer fisso */}
        <div className="flex gap-3 px-6 py-4 border-t border-surface-100 dark:border-surface-700 flex-shrink-0">
          <button type="button" className="btn-secondary flex-1 justify-center" onClick={onClose}>
            Annulla
          </button>
          <button type="submit" className="btn-primary flex-1 justify-center">
            {isEdit ? 'Salva modifiche' : 'Aggiungi spesa'}
          </button>
        </div>
      </form>
    </BottomSheet>
  )
}
