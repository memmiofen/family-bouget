import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import '../styles/FixedExpensesDashboard.css';

interface FixedExpense {
  _id: string;
  amount: number;
  category: string;
  description: string;
  recurringDetails: {
    frequency: 'monthly';
    nextDate: Date;
  };
}

interface CategoryTotal {
  category: string;
  amount: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export const FixedExpensesDashboard: React.FC = () => {
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);

  useEffect(() => {
    const fetchFixedExpenses = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get<FixedExpense[]>('http://localhost:5004/api/expenses/fixed', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setFixedExpenses(response.data);
        
        // חישוב סך הכל
        const total = response.data.reduce((sum, expense) => sum + expense.amount, 0);
        setTotalAmount(total);

        // חישוב סכומים לפי קטגוריה
        const categoryMap = new Map<string, number>();
        response.data.forEach(expense => {
          const currentAmount = categoryMap.get(expense.category) || 0;
          categoryMap.set(expense.category, currentAmount + expense.amount);
        });

        const totals = Array.from(categoryMap.entries()).map(([category, amount]) => ({
          category,
          amount
        }));

        setCategoryTotals(totals);
      } catch (error) {
        console.error('שגיאה בטעינת הוצאות קבועות:', error);
      }
    };

    fetchFixedExpenses();
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="fixed-expenses-dashboard">
      <div className="dashboard-header">
        <h3>הוצאות קבועות לחודש הבא</h3>
        <div className="chart-description">
          כאן תוכל לראות את ההוצאות הקבועות שלך (כמו שכר דירה, חשמל) שצריך לשמור עבורן כסף לסוף החודש
        </div>
        <div className="total-amount">
          סכום לשמור: {formatNumber(totalAmount)}
        </div>
      </div>
      <div className="pie-chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={categoryTotals}
              dataKey="amount"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label={(entry) => `${entry.category}: ${formatNumber(entry.amount)}`}
            >
              {categoryTotals.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatNumber(value)}
              labelFormatter={(label) => `קטגוריה: ${label}`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
