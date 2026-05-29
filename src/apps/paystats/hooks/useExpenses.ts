import { useState, useCallback, useEffect } from 'react'
import { storage } from '../storage'
import type { Category, Expense } from '../types'
// PayStats è un modulo della shell: per la sync per-utente usa l'auth dell'hub.
import { useAuth } from '../../../auth/AuthContext'
import {
  loadAll,
  upsertCategoryRemote, deleteCategoryRemote,
  upsertExpenseRemote, deleteExpenseRemote,
  setIncomeRemote, setCurrencyRemote,
} from '../remote'

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function useExpenses() {
  const { configured, user } = useAuth()
  const userId = user?.id ?? null
  // Backend remoto attivo solo con Supabase configurato e utente loggato.
  const remote = configured && Boolean(userId)

  const [categories, setCategories] = useState<Category[]>([])
  const [expenses,   setExpenses]   = useState<Expense[]>([])
  const [income,     setIncomeState] = useState<number>(2500)
  const [currency,   setCurrencyState] = useState<string>('EUR')
  const [loading,    setLoading]    = useState<boolean>(remote)

  // Caricamento iniziale: da Supabase (per-utente) o da localStorage (demo).
  useEffect(() => {
    let cancelled = false
    if (remote && userId) {
      setLoading(true)
      loadAll(userId)
        .then(data => {
          if (cancelled) return
          setCategories(data.categories)
          setExpenses(data.expenses)
          setIncomeState(data.income)
          setCurrencyState(data.currency)
          setLoading(false)
        })
        .catch(() => { if (!cancelled) setLoading(false) })
    } else {
      setCategories(storage.getCategories())
      setExpenses(storage.getExpenses())
      setIncomeState(storage.getIncome())
      setCurrencyState(storage.getCurrency())
      setLoading(false)
    }
    return () => { cancelled = true }
  }, [remote, userId])

  const setIncome = useCallback((value: number) => {
    setIncomeState(value)
    if (remote && userId) void setIncomeRemote(userId, value)
    else storage.setIncome(value)
  }, [remote, userId])

  const setCurrency = useCallback((value: string) => {
    setCurrencyState(value)
    if (remote && userId) void setCurrencyRemote(userId, value)
    else storage.setCurrency(value)
  }, [remote, userId])

  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    const created: Category = { ...cat, id: uid() }
    setCategories(prev => {
      const next = [...prev, created]
      if (!remote) storage.saveCategories(next)
      return next
    })
    if (remote && userId) void upsertCategoryRemote(userId, created)
  }, [remote, userId])

  const updateCategory = useCallback((id: string, patch: Partial<Omit<Category, 'id'>>) => {
    setCategories(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...patch } : c)
      if (!remote) storage.saveCategories(next)
      else {
        const updated = next.find(c => c.id === id)
        if (updated && userId) void upsertCategoryRemote(userId, updated)
      }
      return next
    })
  }, [remote, userId])

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => {
      const next = prev.filter(c => c.id !== id)
      if (!remote) storage.saveCategories(next)
      return next
    })
    if (remote && userId) void deleteCategoryRemote(userId, id)
  }, [remote, userId])

  const addExpense = useCallback((exp: Omit<Expense, 'id' | 'createdAt'>) => {
    const created: Expense = { ...exp, id: uid(), createdAt: new Date().toISOString() }
    setExpenses(prev => {
      const next = [...prev, created]
      if (!remote) storage.saveExpenses(next)
      return next
    })
    if (remote && userId) void upsertExpenseRemote(userId, created)
  }, [remote, userId])

  const updateExpense = useCallback((id: string, patch: Partial<Omit<Expense, 'id' | 'createdAt'>>) => {
    setExpenses(prev => {
      const next = prev.map(e => e.id === id ? { ...e, ...patch } : e)
      if (!remote) storage.saveExpenses(next)
      else {
        const updated = next.find(e => e.id === id)
        if (updated && userId) void upsertExpenseRemote(userId, updated)
      }
      return next
    })
  }, [remote, userId])

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => {
      const next = prev.filter(e => e.id !== id)
      if (!remote) storage.saveExpenses(next)
      return next
    })
    if (remote && userId) void deleteExpenseRemote(userId, id)
  }, [remote, userId])

  const resetToDemo = useCallback(() => {
    // Solo in modalità demo (localStorage): non tocca i dati di un account.
    if (remote) return
    storage.resetToDemo()
    window.location.reload()
  }, [remote])

  return {
    categories, expenses, income, currency, loading,
    setIncome, setCurrency, addCategory, updateCategory, deleteCategory,
    addExpense, updateExpense, deleteExpense, resetToDemo,
  }
}
