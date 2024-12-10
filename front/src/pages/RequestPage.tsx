// src/pages/RequestPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/RequestPage.css';
import axios from 'axios';

interface Request {
    _id: string;
    childId: {
        _id: string;
        username: string;
    };
    parentId: string;
    amount: number;
    description: string;
    category?: string;
    requestDate: Date;
    status: 'pending' | 'approved' | 'rejected';
    transferMethod?: string;
    transferDetails?: string;
}

const RequestPage: React.FC = () => {
    const navigate = useNavigate();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5004/api/requests/my-requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(response.data);
        } catch (error) {
            setError('שגיאה בטעינת הבקשות');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestSubmit = async () => {
        if (!amount || !description || !category) {
            setError('נא למלא את כל השדות');
            return;
        }

        try {
            setError('');
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            await axios.post('http://localhost:5004/api/requests', 
                {
                    amount: parseFloat(amount),
                    description,
                    category
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // רענון הדשבורד
            const userId = localStorage.getItem('userId');
            if (userId) {
                try {
                    await axios.get(
                        `http://localhost:5004/api/dashboard/refreshDashboard/${userId}`,
                        {
                            headers: { Authorization: `Bearer ${token}` }
                        }
                    );
                } catch (error) {
                    console.error('שגיאה ברענון הדשבורד:', error);
                }
            }

            setAmount('');
            setDescription('');
            setCategory('');
            await fetchRequests();

            alert('הבקשה נשלחה בהצלחה!');

        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 'שגיאה ביצירת הבקשה';
            setError(errorMessage);
            console.error('שגיאה:', error);
        }
    };

    return (
        <div className="request-container">
            <header className="request-header">
                <h1>בקשת כסף חדשה</h1>
                <button onClick={() => navigate('/dashboard')} className="back-button">
                    חזרה לדשבורד
                </button>
            </header>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={(e) => { e.preventDefault(); handleRequestSubmit(); }} className="request-form">
                <div className="form-group">
                    <label htmlFor="amount">סכום:</label>
                    <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="0"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="category">קטגוריה:</label>
                    <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    >
                        <option value="">בחר קטגוריה</option>
                        <option value="מזון">מזון</option>
                        <option value="בילויים">בילויים</option>
                        <option value="קניות">קניות</option>
                        <option value="חינוך">חינוך</option>
                        <option value="בריאות">בריאות</option>
                        <option value="ביגוד">ביגוד</option>
                        <option value="אחר">אחר</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="description">תיאור:</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="submit-button">שלח בקשה</button>
            </form>

            <section className="previous-requests">
                <h2>בקשות קודמות</h2>
                {loading ? (
                    <div className="loading">טוען...</div>
                ) : (
                    <div className="requests-list">
                        {requests.map((request) => (
                            <div key={request._id} className="request-item">
                                <div className="request-details">
                                    <span className="amount">₪{request.amount.toLocaleString()}</span>
                                    <span className="description">{request.description}</span>
                                    <span className={`status status-${request.status}`}>
                                        {request.status === 'pending' ? 'ממתין' : 
                                         request.status === 'approved' ? 'אושר' : 'נדחה'}
                                    </span>
                                </div>
                                <div className="request-date">
                                    {new Date(request.requestDate).toLocaleDateString('he-IL')}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="pending-requests">
                <h2>בקשות ממתינות</h2>
                {loading ? (
                    <div className="loading">טוען...</div>
                ) : (
                    <div className="requests-list">
                        {requests
                            .filter(req => req.status === 'pending')
                            .map((request) => (
                                <div key={request._id} className="request-item">
                                    <div className="request-details">
                                        <span className="amount">₪{request.amount.toLocaleString()}</span>
                                        <span className="description">{request.description}</span>
                                        <span className="category">{request.category}</span>
                                        <span className="status status-pending">ממתין</span>
                                    </div>
                                    <div className="request-date">
                                        {new Date(request.requestDate).toLocaleDateString('he-IL')}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default RequestPage;
