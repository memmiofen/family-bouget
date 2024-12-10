import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaChild, FaKey, FaCopy, FaWhatsapp, FaSms, FaEnvelope, FaTrash, FaMinus, FaBell } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/ChildrenManagementPage.css';

interface Request {
    id: string;
    childId: {
        _id: string;
        name: string;
    };
    amount: number;
    description: string;
    category: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt: string;
    responseMessage?: string;
    waitingTime: number;
}

interface Child {
    _id: string;
    name: string;
    monthlyAllowance: number;
    remainingBudget: number;
    pendingRequests?: Request[];
}

const API_URL = 'http://localhost:5004';

const ChildrenManagementPage: React.FC = () => {
    const [children, setChildren] = useState<Child[]>([]);
    const [selectedChild, setSelectedChild] = useState<string | null>(null);
    const [showAddChildModal, setShowAddChildModal] = useState(false);
    const [newChildName, setNewChildName] = useState('');
    const [newChildAllowance, setNewChildAllowance] = useState('');
    const [showShareModal, setShowShareModal] = useState(false);
    const [selectedChildForShare, setSelectedChildForShare] = useState<Child | null>(null);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [budgetAmount, setBudgetAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedPassword, setGeneratedPassword] = useState('');

    useEffect(() => {
        fetchChildren();
        fetchPendingRequests();
        
        // רענון כל 30 שניות
        const interval = setInterval(() => {
            fetchChildren();
            fetchPendingRequests();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchChildren = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/children`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setChildren(response.data);
        } catch (error) {
            console.error('Error fetching children:', error);
            toast.error('שגיאה בטעינת רשימת הילדים');
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/parents/pending-requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // ארגן את הבקשות לפי ילד
            const requestsByChild = response.data.reduce((acc: { [key: string]: Request[] }, request: Request) => {
                const childId = request.childId._id; 
                if (!acc[childId]) {
                    acc[childId] = [];
                }
                acc[childId].push({
                    ...request,
                    id: request.id,
                    childId: request.childId 
                });
                return acc;
            }, {});

            // עדכן את הילדים עם הבקשות שלהם
            setChildren(prevChildren => 
                prevChildren.map(child => ({
                    ...child,
                    pendingRequests: requestsByChild[child._id] || []
                }))
            );

            console.log('Children after update:', children);
        } catch (error) {
            console.error('Error fetching pending requests:', error);
            toast.error('שגיאה בטעינת הבקשות הממתינות');
        }
    };

    const handleAddChild = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/api/children`, {
                name: newChildName,
                monthlyAllowance: Number(newChildAllowance)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setChildren([...children, response.data.child]);
            setShowAddChildModal(false);
            setNewChildName('');
            setNewChildAllowance('');
            toast.success('הילד נוסף בהצלחה!');
        } catch (error) {
            console.error('Error adding child:', error);
            toast.error('שגיאה בהוספת הילד');
        }
    };

    const handleShowPassword = async (childId: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/children/${childId}/password`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const child = children.find(child => child._id === childId);
            if (child) {
                setSelectedChildForShare(child);
                setGeneratedPassword(response.data.password);
                setShowShareModal(true);
            }
        } catch (error: any) {
            console.error('Error fetching password:', error);
            toast.error(error.response?.data?.message || 'שגיאה בטעינת הסיסמה');
        }
    };

    const handleDeleteChild = async (childId: string) => {
        if (window.confirm('האם אתה בטוח שברצונך למחוק את הילד?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_URL}/api/children/${childId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setChildren(children.filter(child => child._id !== childId));
                toast.success('הילד נמחק בהצלחה!');
            } catch (error) {
                console.error('Error deleting child:', error);
                toast.error('שגיאה במחיקת הילד');
            }
        }
    };

    const handleAddBudget = async (action: 'add' | 'reduce') => {
        if (!selectedChild || !budgetAmount) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/children/${selectedChild}/add-budget`, {
                amount: parseFloat(budgetAmount),
                action
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            await fetchChildren();
            setShowBudgetModal(false);
            setBudgetAmount('');
            setSelectedChild(null);
            toast.success('התקציב עודכן בהצלחה');
        } catch (error) {
            console.error('Error adding budget:', error);
            toast.error('שגיאה בהוספת התקציב');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = (method: string, password: string) => {
        let shareUrl = '';
        const message = `הסיסמה שלך היא: ${password}`;
        
        switch (method) {
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                break;
            case 'sms':
                shareUrl = `sms:?body=${encodeURIComponent(message)}`;
                break;
            case 'email':
                shareUrl = `mailto:?subject=הסיסמה שלך&body=${encodeURIComponent(message)}`;
                break;
        }
        
        if (shareUrl) {
            window.open(shareUrl, '_blank');
        }
    };

    const handleRequestAction = async (requestId: string, action: 'approve' | 'reject', message?: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/api/parents/requests/${requestId}/${action}`, 
                { message },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // עדכון הילד הספציפי עם הנתונים החדשים
            const { child: updatedChild } = response.data;
            setChildren(prevChildren => 
                prevChildren.map(child => 
                    child._id === updatedChild._id 
                        ? { 
                            ...child, 
                            remainingBudget: updatedChild.remainingBudget,
                            pendingRequests: child.pendingRequests?.filter(req => req.id !== requestId)
                        }
                        : child
                )
            );
            
            toast.success(action === 'approve' ? 'הבקשה אושרה בהצלחה' : 'הבקשה נדחתה');
        } catch (error: any) {
            console.error('Error handling request:', error);
            toast.error(error.response?.data?.message || 'שגיאה בטיפול בבקשה');
        }
    };

    return (
        <div className="children-management-page">
            <h1>ניהול ילדים</h1>
            <button className="add-child-button" onClick={() => setShowAddChildModal(true)}>
                <FaPlus /> הוסף ילד
            </button>
            <div className="children-list">
                {children.map(child => (
                    <div key={child._id} className="child-card">
                        <div 
                            className="child-info"
                            onClick={() => setSelectedChild(selectedChild === child._id ? null : child._id)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="child-header">
                                <h2><FaChild /> {child.name}</h2>
                                <div className="child-actions">
                                    <button 
                                        className="action-button share-button" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleShowPassword(child._id);
                                        }}
                                        title="הצג קוד גישה"
                                    >
                                        <FaKey />
                                    </button>
                                    <button 
                                        className="action-button budget-button" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedChild(child._id);
                                            setShowBudgetModal(true);
                                        }}
                                        title="עדכן תקציב"
                                    >
                                        <FaPlus />
                                    </button>
                                    <button 
                                        className="action-button delete-button" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm(`האם אתה בטוח שברצונך למחוק את ${child.name}?`)) {
                                                handleDeleteChild(child._id);
                                            }
                                        }}
                                        title="מחק ילד"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                            <div className="child-details">
                                <div className="budget-info">
                                    <div className="budget-item">
                                        <span className="budget-label">הקצבה חודשית:</span>
                                        <span className="budget-value">₪{child.monthlyAllowance.toLocaleString()}</span>
                                    </div>
                                    <div className="budget-item">
                                        <span className="budget-label">יתרה:</span>
                                        <span className={`budget-value ${child.remainingBudget < 0 ? 'negative' : ''}`}>
                                            ₪{child.remainingBudget.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                {child.pendingRequests && child.pendingRequests.length > 0 && (
                                    <div className="notification-badge" title="בקשות ממתינות">
                                        <FaBell />
                                        <span className="notification-count">
                                            {child.pendingRequests.length}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {selectedChild === child._id && child.pendingRequests && child.pendingRequests.length > 0 && (
                            <div className="pending-requests">
                                <h3>בקשות ממתינות:</h3>
                                <ul>
                                    {child.pendingRequests.map(request => (
                                        <li key={request.id}>
                                            <p>סכום: ₪{request.amount.toLocaleString()}</p>
                                            <p>תיאור: {request.description}</p>
                                            <p>קטגוריה: {request.category}</p>
                                            <p>תאריך: {new Date(request.createdAt).toLocaleDateString('he-IL')}</p>
                                            <p>זמן המתנה: {request.waitingTime} שעות</p>
                                            <div className="request-actions">
                                                <button 
                                                    className="approve-button"
                                                    onClick={() => handleRequestAction(request.id, 'approve')}
                                                >
                                                    אשר
                                                </button>
                                                <button 
                                                    className="reject-button"
                                                    onClick={() => handleRequestAction(request.id, 'reject')}
                                                >
                                                    דחה
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* מודל הוספת ילד */}
            {showAddChildModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>הוספת ילד חדש</h2>
                        <div className="form-group">
                            <label>שם הילד:</label>
                            <input
                                type="text"
                                value={newChildName}
                                onChange={(e) => setNewChildName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>תקציב חודשי:</label>
                            <input
                                type="number"
                                value={newChildAllowance}
                                onChange={(e) => setNewChildAllowance(e.target.value)}
                                required
                            />
                        </div>
                        <div className="modal-buttons">
                            <button onClick={handleAddChild} className="submit-button">
                                הוסף
                            </button>
                            <button 
                                onClick={() => {
                                    setShowAddChildModal(false);
                                    setNewChildName('');
                                    setNewChildAllowance('');
                                }} 
                                className="cancel-button"
                            >
                                ביטול
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* מודל הצגת סיסמה */}
            {showShareModal && selectedChildForShare && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>הסיסמה של {selectedChildForShare.name}</h2>
                        <div className="password-display">
                            <div className="password-text">{generatedPassword}</div>
                            <button 
                                className="copy-button"
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedPassword);
                                    toast.success('הסיסמה הועתקה ללוח');
                                }}
                            >
                                <FaCopy /> העתק
                            </button>
                        </div>
                        <div className="share-options">
                            <h3>שתף את הסיסמה דרך:</h3>
                            <div className="share-buttons">
                                <button onClick={() => handleShare('whatsapp', generatedPassword)}>
                                    <FaWhatsapp /> WhatsApp
                                </button>
                                <button onClick={() => handleShare('sms', generatedPassword)}>
                                    <FaSms /> SMS
                                </button>
                                <button onClick={() => handleShare('email', generatedPassword)}>
                                    <FaEnvelope /> Email
                                </button>
                            </div>
                        </div>
                        <button 
                            className="close-button" 
                            onClick={() => setShowShareModal(false)}
                        >
                            סגור
                        </button>
                    </div>
                </div>
            )}

            {/* מודל עדכון תקציב */}
            {showBudgetModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>עדכון תקציב</h2>
                        <div className="budget-form">
                            <div className="form-group">
                                <label>סכום:</label>
                                <input
                                    type="number"
                                    value={budgetAmount}
                                    onChange={(e) => setBudgetAmount(e.target.value)}
                                    placeholder="הכנס סכום"
                                />
                            </div>
                            <div className="budget-actions">
                                <button 
                                    className="add-budget-button"
                                    onClick={() => handleAddBudget('add')}
                                    disabled={loading}
                                >
                                    <FaPlus /> הוסף לתקציב
                                </button>
                                <button 
                                    className="reduce-budget-button"
                                    onClick={() => handleAddBudget('reduce')}
                                    disabled={loading}
                                >
                                    <FaMinus /> הורד מהתקציב
                                </button>
                            </div>
                            <button 
                                className="cancel-button"
                                onClick={() => {
                                    setShowBudgetModal(false);
                                    setBudgetAmount('');
                                }}
                                disabled={loading}
                            >
                                ביטול
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChildrenManagementPage;
