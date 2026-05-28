import { useState, useCallback } from 'react'
import { storage } from '../storage'
import type { Category, Expense } from '../types'

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function useExpenses() {
  const [categories, setCategories] = useState<Category[]>(() => storage.getCategories())
  const [expenses,   setExpenses]   = useState<Expense[]>(() => storage.getExpenses())
  const [income,     setIncomeState] = useState<number>(() => storage.getIncome())

  const setIncome = useCallback((value: number) => {
    setIncomeState(value)
    storage.setIncome(value)
  }, [])

  const addCategory = useCallback((cat: Omit<Category, 'id'>) => {
    const next = [...categories, { ...cat, id: uid() }]
    setCategories(next)
    storage.saveCategories(next)
  }, [categories])

  const updateCategory = useCallback((id: string, patch: Partial<Omit<Category, 'id'>>) => {
    const next = categories.map(c => c.id === id ? { ...c, ...patch } : c)
    setCategories(next)
    storage.saveCategories(next)
  }, [categories])

  const deleteCategory = useCallback((id: string) => {
    const next = categories.filter(c => c.id !== id)
    setCategories(next)
    storage.saveCategories(next)
  }, [categories])

  const addExpense = useCallback((exp: Omit<Expense, 'id' | 'createdAt'>) => {
    const next = [...expenses, { ...exp, id: uid(), createdAt: new Date().toISOString() }]
    setExpenses(next)
    storage.saveExpenses(next)
  }, [expenses])

  const deleteExpense = useCallback((id: string) => {
    const next = expenses.filter(e => e.id !== id)
    setExpenses(next)
    storage.saveExpenses(next)
  }, [expenses])

  const resetToDemo = useCallback(() => {
    storage.resetToDemo()
    window.location.reload()
  }, [])

  return {
    categories, expenses, income,
    setIncome, addCategory, updateCategory, deleteCategory,
    addExpense, deleteExpense, resetToDemo,
  }
}
