import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ExpenseHistoryPage.css';

interface Expense {
    id: number;
    date: string;
    category: string;
    amount: number;
    description: string;
}

const ExpenseHistoryPage: React.FC = () => {
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState<Expense[]>([
        { id: 1, date: '2024-11-01', category: 'מזון', amount: 200, description: 'קניות בסופר' },
        { id: 2, date: '2024-11-05', category: 'תחבורה', amount: 50, description: 'כרטיס רכבת' },
    ]);

    const handleFilter = () => {
        const filteredExpenses = expenses.filter(expense => 
            expense.amount > 100
        );
        setExpenses(filteredExpenses);
    };

    const handleSort = (sortBy: string) => {
        const newExpenses = [...expenses];
        
        switch (sortBy) {
            case 'amount':
                newExpenses.sort((a, b) => b.amount - a.amount);
                break;
            case 'date':
                newExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                break;
            case 'category':
                newExpenses.sort((a, b) => a.category.localeCompare(b.category));
                break;
        }
        
        setExpenses(newExpenses);
    };

    const exportToCSV = () => {
        const table = document.getElementById('expenses-table');
        if (table) {
            // לוגיקת הייצוא ל-CSV
        }
    };

    return (
        <div className="expense-history-container">
            <h1>היסטוריית הוצאות</h1>
            <button className="back-button" onClick={() => navigate('/dashboard')}>חזרה לדף הבית</button>

            <div className="filter-sort-container">
                <button onClick={handleFilter}>סינון</button>
                <button onClick={() => handleSort('amount')}>מיון לפי סכום</button>
                <button onClick={() => handleSort('date')}>מיון לפי תאריך</button>
                <button onClick={() => handleSort('category')}>מיון לפי קטגוריה</button>
            </div>

            <table id="expenses-table" className="expenses-table">
                {/* ... שאר הקוד של הטבלה נשאר זהה ... */}
            </table>
            
            <div className="charts-container">
                <div className="category-chart">גרף התפלגות לפי קטגוריות</div>
                <div className="trend-chart">תרשים מגמה</div>
            </div>
        </div>
    );
};

export default ExpenseHistoryPage;