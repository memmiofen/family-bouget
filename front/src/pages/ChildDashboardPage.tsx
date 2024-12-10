import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaMoneyBillWave, FaPiggyBank, FaHistory, FaPlusCircle, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaComment, FaFileAlt } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/ChildDashboardPage.css';

interface Request {
    id: string;
    amount: number;
    description: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    responseMessage?: string;
    category: string;
}

interface ChildData {
    name: string;
    monthlyAllowance: number;
    remainingBudget: number;
}

const API_URL = 'http://localhost:5004';

const savingTips = [
    'שים לב לכמה כסף אתה מוציא על ממתקים - אולי כדאי לחסוך קצת?',
    'נסה לחסוך 10% מדמי הכיס שלך כל חודש',
    'לפני שאתה קונה משהו, חכה יום אחד וחשוב אם אתה באמת צריך את זה',
    'השווה מחירים לפני שאתה קונה',
    'נסה להרוויח כסף נוסף בעזרת עבודות קטנות בבית'
];

const categories = ['משחקים', 'בגדים', 'ממתקים', 'צעצועים', 'ספרים', 'בילויים', 'אחר'];

const ChildDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [childData, setChildData] = useState<ChildData | null>(null);
    const [requests, setRequests] = useState<Request[]>([]);
    const [requestAmount, setRequestAmount] = useState('');
    const [requestDescription, setRequestDescription] = useState('');
    const [requestCategory, setRequestCategory] = useState(categories[0]);
    const [loading, setLoading] = useState(false);
    const [currentTip, setCurrentTip] = useState('');
    const [showRequestModal, setShowRequestModal] = useState(false);

    useEffect(() => {
        setCurrentTip(savingTips[Math.floor(Math.random() * savingTips.length)]);
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('childToken');
        const childId = localStorage.getItem('childId');

        if (!token || !childId) {
            navigate('/login');
            return;
        }

        fetchChildData(childId, token);
        fetchRequests(childId, token);
    }, [navigate]);

    const fetchChildData = async (childId: string, token: string) => {
        try {
            const response = await axios.get(`${API_URL}/api/children/${childId}/data`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setChildData(response.data);
        } catch (error) {
            console.error('Error fetching child data:', error);
            toast.error('שגיאה בטעינת הנתונים');
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                localStorage.removeItem('childToken');
                localStorage.removeItem('childId');
                navigate('/login');
            }
        }
    };

    const fetchRequests = async (childId: string, token: string) => {
        try {
            const response = await axios.get(`${API_URL}/api/children/${childId}/requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching requests:', error);
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                localStorage.removeItem('childToken');
                localStorage.removeItem('childId');
                navigate('/login');
            }
        }
    };

    const handleSubmitRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!requestAmount || !requestDescription || !requestCategory) {
            toast.error('נא למלא את כל השדות');
            return;
        }

        const childId = localStorage.getItem('childId');
        const token = localStorage.getItem('childToken');

        if (!childId || !token) {
            navigate('/login');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/children/${childId}/requests`, {
                amount: parseFloat(requestAmount),
                description: requestDescription,
                category: requestCategory
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('הבקשה נשלחה בהצלחה');
            setRequestAmount('');
            setRequestDescription('');
            setShowRequestModal(false);
            
            // רענון הנתונים אחרי שליחת הבקשה
            await fetchChildData(childId, token);
            await fetchRequests(childId, token);
        } catch (error) {
            console.error('Error submitting request:', error);
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'שגיאה בשליחת הבקשה');
            }
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
                return <FaCheckCircle className="status-icon approved" />;
            case 'rejected':
                return <FaTimesCircle className="status-icon rejected" />;
            default:
                return <FaHourglassHalf className="status-icon pending" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'approved':
                return 'אושר';
            case 'rejected':
                return 'נדחה';
            default:
                return 'ממתין לאישור';
        }
    };

    if (!childData) {
        return <div className="loading">טוען...</div>;
    }

    return (
        <div className="child-dashboard-container">
            <div className="dashboard-hero">
                <div className="hero-content">
                    <h1>שלום {childData.name}! 👋</h1>
                    <div className="daily-tip">
                        <div className="tip-bubble">
                            <FaPiggyBank className="tip-icon" />
                            <p>{currentTip}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="stats-container">
                <div className="stat-card monthly-budget">
                    <div className="stat-icon">
                        <FaMoneyBillWave />
                    </div>
                    <div className="stat-info">
                        <h3>תקציב חודשי</h3>
                        <p className="stat-value">₪{childData.monthlyAllowance.toLocaleString()}</p>
                        <div className="stat-progress">
                            <div 
                                className="progress-bar" 
                                style={{ 
                                    width: `${Math.min(100, (childData.remainingBudget / childData.monthlyAllowance) * 100)}%` 
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="stat-card remaining-budget">
                    <div className="stat-icon">
                        <FaPiggyBank />
                    </div>
                    <div className="stat-info">
                        <h3>נשאר בתקציב</h3>
                        <p className="stat-value">₪{childData.remainingBudget.toLocaleString()}</p>
                        <p className="stat-subtitle">
                            {childData.remainingBudget > 0 ? 
                                '🌟 מצוין! אתה חוסך יפה' : 
                                '💡 אולי כדאי לחסוך קצת?'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="recent-activity">
                <div className="section-title">
                    <FaHistory className="section-icon" />
                    <h2>הבקשות האחרונות שלי</h2>
                    <button 
                        className="new-request-btn"
                        onClick={() => setShowRequestModal(true)}
                    >
                        <FaPlusCircle /> בקשה חדשה
                    </button>
                </div>

                <div className="activity-cards">
                    {requests.map((request) => (
                        <div key={request.id} className={`activity-card ${request.status}`}>
                            <div className="request-header">
                                {request.status === 'pending' && (
                                    <div className="status-badge pending">
                                        <FaHourglassHalf /> ממתין לאישור
                                    </div>
                                )}
                                {request.status === 'approved' && (
                                    <div className="status-badge approved">
                                        <FaCheckCircle /> אושר
                                    </div>
                                )}
                                {request.status === 'rejected' && (
                                    <div className="status-badge rejected">
                                        <FaTimesCircle /> נדחה
                                    </div>
                                )}
                                <span className="request-date">
                                    {new Date(request.createdAt).toLocaleDateString('he-IL')}
                                </span>
                            </div>
                            <div className="request-amount">₪{request.amount.toLocaleString()}</div>
                            <div className="request-category">
                                <span className="category-tag">{request.category}</span>
                            </div>
                            <p className="request-description">{request.description}</p>
                            {request.responseMessage && (
                                <div className="response-message">
                                    <FaComment className="message-icon" />
                                    {request.responseMessage}
                                </div>
                            )}
                        </div>
                    ))}
                    {(!requests || requests.length === 0) && (
                        <div className="empty-state">
                            <FaFileAlt className="empty-icon" />
                            <p>עדיין אין לך בקשות</p>
                            <button 
                                className="create-first-btn"
                                onClick={() => setShowRequestModal(true)}
                            >
                                צור בקשה ראשונה
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showRequestModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>בקשה חדשה</h2>
                        <form onSubmit={handleSubmitRequest}>
                            <div className="form-group">
                                <label>סכום (₪)</label>
                                <input
                                    type="number"
                                    value={requestAmount}
                                    onChange={(e) => setRequestAmount(e.target.value)}
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>קטגוריה</label>
                                <select
                                    value={requestCategory}
                                    onChange={(e) => setRequestCategory(e.target.value)}
                                    required
                                >
                                    {categories.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>תיאור</label>
                                <textarea
                                    value={requestDescription}
                                    onChange={(e) => setRequestDescription(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="modal-buttons">
                                <button type="submit" disabled={loading}>
                                    {loading ? 'שולח...' : 'שלח בקשה'}
                                </button>
                                <button type="button" onClick={() => setShowRequestModal(false)}>
                                    ביטול
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChildDashboardPage;
