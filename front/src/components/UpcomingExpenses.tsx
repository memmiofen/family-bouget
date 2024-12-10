import React from 'react';
import { Expense } from '../types/dashboard';

interface UpcomingExpensesProps {
    expenses: Expense[];
}

export const UpcomingExpenses: React.FC<UpcomingExpensesProps> = ({ expenses }) => {
    return (
        <div className="upcoming-expenses-list">
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