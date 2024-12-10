import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaHome } from 'react-icons/fa';
import axios from 'axios';
import '../styles/AddIncomePage.css';

const AddIncomePage: React.FC = () => {
    const navigate = useNavigate();
    const [amount, setAmount] = useState('');
    const [source, setSource] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || !source || !description) {
            toast.warning('נא למלא את כל השדות');
            return;
        }

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            toast.error('נא להזין סכום חיובי');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');

            if (!token || !userId) {
                toast.error('אנא התחבר מחדש למערכת');
                navigate('/login');
                return;
            }

            await axios.post('http://localhost:5004/api/income', {
                amount: numericAmount,
                source,
                description,
                userId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('ההכנסה נוספה בהצלחה!');
            navigate('/dashboard');
        } catch (error: any) {
            console.error('Error adding income:', error);
            toast.error(error.response?.data?.message || 'שגיאה בהוספת ההכנסה. אנא נסה שוב.');
        }
    };

    return (
        <div className="add-income-container">
            <h2>הוספת הכנסה חדשה</h2>
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>סכום:</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="הכנס סכום"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>מקור:</label>
                    <select
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        required
                    >
                        <option value="">בחר מקור</option>
                        <option value="salary">משכורת</option>
                        <option value="bonus">בונוס</option>
                        <option value="gift">מתנה</option>
                        <option value="other">אחר</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>תיאור:</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="הוסף תיאור להכנסה"
                        required
                    />
                </div>

                <div className="form-actions">
                    <button type="submit">הוסף הכנסה</button>
                    <button type="button" onClick={() => navigate('/dashboard')}>ביטול</button>
                </div>
            </form>

            <button 
                className="back-to-home" 
                onClick={() => navigate('/dashboard')}
                title="חזור לדף הבית"
            >
                <FaHome />
            </button>
        </div>
    );
};

export default AddIncomePage;