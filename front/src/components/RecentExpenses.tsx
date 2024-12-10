import React from 'react';
import { Expense } from '../types/dashboard';

interface RecentExpensesProps {
    expenses: Expense[];
}

export const RecentExpenses: React.FC<RecentExpensesProps> = ({ expenses }) => {
    return (
        <div className="recent-expenses-list">
            {expenses.map((expense) => (
                <div key={expense.id} className="expense-item">
                    <div className="expense-title">{expense.title}</div>
                    <div className="expense-amount">{expense.amount}</div>
                    <div className="expense-category">{expense.category}</div>
                    <div className="expense-date">{new Date(expense.date).toLocaleDateString('he-IL')}</div>
                </div>
            ))}
        </div>
    );
}; 