import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/AddExpensePage.css';

const AddExpensePage: React.FC = () => {
    const navigate = useNavigate();
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('אנא התחבר מחדש למערכת');
                navigate('/login');
                return;
            }

            if (!amount || !category || !description) {
                setError('נא למלא את כל השדות');
                return;
            }

            const numericAmount = parseFloat(amount);
            if (isNaN(numericAmount) || numericAmount <= 0) {
                setError('נא להזין סכום חיובי');
                return;
            }

            const response = await axios.post(
                'http://localhost:5004/api/expenses', 
                {
                    amount: numericAmount,
                    category,
                    description,
                    date: new Date()
                },
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('תשובה מהשרת:', response.data);
            navigate('/dashboard');

        } catch (error: any) {
            console.error('שגיאה מלאה:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || 'שגיאה בהוספת ההוצאה';
            setError(errorMessage);
        }
    };

    return (
        <div className="add-expense-container">
            <h2>הוספת הוצאה חדשה</h2>
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>סכום:</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>קטגוריה:</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    >
                        <option value="">בחר קטגוריה</option>
                        <option value="מזון">מזון</option>
                        <option value="תחבורה">תחבורה</option>
                        <option value="בילויים">בילויים</option>
                        <option value="קניות">קניות</option>
                        <option value="חינוך">חינוך</option>
                        <option value="בריאות">בריאות</option>
                        <option value="ביגוד">ביגוד</option>
                        <option value="אחר">אחר</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>תיאור:</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>

                <div className="buttons-container">
                    <button type="submit">הוסף הוצאה</button>
                    <button type="button" onClick={() => navigate('/dashboard')}>
                        ביטול
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddExpensePage;