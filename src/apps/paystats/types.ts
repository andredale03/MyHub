export interface Category {
  id: string
  name: string
  color: string
  icon: string
  budget?: number
}

export interface Expense {
  id: string
  amount: number
  description: string
  categoryId: string
  date: string
  createdAt: string
}
