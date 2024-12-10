// src/pages/UserManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LinkAccountsModal from '../components/LinkAccountsModal';
import '../styles/UserManagementPage.css';

interface User {
    id: string;
    username: string;
    role: string;
    budget: number;
    isLinked?: boolean;
}

interface LinkedAccount {
    id: string;
    username: string;
    role: string;
    budget: number;
}

const UserManagementPage: React.FC = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
    const [isLinkModalOpen, setLinkModalOpen] = useState(false);
    const [userRole, setUserRole] = useState<'parent' | 'child'>('parent');
    const [linkCode, setLinkCode] = useState('');
    const [isFormVisible, setFormVisible] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchUserData();
        fetchLinkedAccounts();
    }, []);

    const fetchUserData = async () => {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                setMessage('לא נמצא מזהה משתמש');
                return;
            }

            const response = await axios.get(`http://localhost:5004/api/auth/users/${userId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            setUserRole(response.data.role);
            setCurrentUser(response.data);
        } catch (error) {
            console.error('Error fetching user data:', error);
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                // אם יש שגיאת אימות, נחזיר למסך ההתחברות
                localStorage.clear();
                navigate('/login');
            } else {
                setMessage('שגיאה בטעינת נתוני משתמש');
            }
        }
    };

    const fetchLinkedAccounts = async () => {
        try {
            const response = await axios.get('http://localhost:5004/api/users/linked-accounts', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });
            setLinkedAccounts(response.data);
        } catch (error) {
            console.error('Error fetching linked accounts:', error);
            setMessage('שגיאה בטעינת חשבונות מקושרים');
        }
    };

    const generateLinkCode = async () => {
        try {
            const response = await axios.post(
                'http://localhost:5004/api/users/generate-link-code',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setLinkCode(response.data.linkCode);
            setMessage('קוד קישור נוצר בהצלחה');
        } catch (error) {
            console.error('Error generating link code:', error);
            setMessage('שגיאה ביצירת קוד קישור');
        }
    };

    const handleFormSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const name = (form.elements.namedItem('name') as HTMLInputElement).value;
        const budget = parseFloat((form.elements.namedItem('budget') as HTMLInputElement).value);

        try {
            if (currentUser) {
                // עדכון משתמש קיים
                await axios.put(`http://localhost:5004/api/users/${currentUser.id}`, 
                    { name, budget },
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );
                setMessage('המשתמש עודכן בהצלחה');
            }
            setFormVisible(false);
            setCurrentUser(null);
            fetchLinkedAccounts();
        } catch (error) {
            console.error('Error updating user:', error);
            setMessage('שגיאה בעדכון המשתמש');
        }
    };

    return (
        <div className="user-management-container">
            <header className="page-header">
                <h1>ניהול משתמשים</h1>
                <button className="back-button" onClick={() => navigate('/dashboard')}>
                    חזרה לדף הבית
                </button>
            </header>

            {message && (
                <div className={`message ${message.includes('שגיאה') ? 'error' : 'success'}`}>
                    {message}
                </div>
            )}

            <div className="link-accounts-section">
                {userRole === 'parent' ? (
                    <>
                        <h2>קישור חשבון ילד</h2>
                        <div className="link-code-container">
                            <button onClick={generateLinkCode} className="generate-code-button">
                                צור קוד קישור חדש
                            </button>
                            {linkCode && (
                                <div className="link-code-display">
                                    <p>קוד הקישור שלך (תקף ל-24 שעות):</p>
                                    <strong>{linkCode}</strong>
                                    <p className="code-instruction">
                                        העבר קוד זה לילדך כדי לקשר את החשבונות
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <h2>קישור לחשבון הורה</h2>
                        <button 
                            onClick={() => setLinkModalOpen(true)} 
                            className="link-account-button"
                        >
                            קשר לחשבון הורה
                        </button>
                    </>
                )}
            </div>

            <section className="linked-accounts-section">
                <h2>חשבונות מקושרים</h2>
                {linkedAccounts.length > 0 ? (
                    <div className="accounts-grid">
                        {linkedAccounts.map((account) => (
                            <div key={account.id} className="account-card">
                                <div className="account-header">
                                    <h3>{account.username}</h3>
                                    <span className="role-badge">
                                        {account.role === 'parent' ? 'הורה' : 'ילד'}
                                    </span>
                                </div>
                                <div className="account-details">
                                    <p>תקציב: ₪{account.budget.toLocaleString()}</p>
                                </div>
                                {userRole === 'parent' && (
                                    <div className="account-actions">
                                        <button onClick={() => {
                                            setCurrentUser(account);
                                            setFormVisible(true);
                                        }}>
                                            עריכה
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="no-accounts">אין חשבונות מקושרים</p>
                )}
            </section>

            {isFormVisible && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>{currentUser ? 'עריכת משתמש' : 'הוספת משתמש'}</h2>
                        <form onSubmit={handleFormSubmit}>
                            <div className="form-group">
                                <label htmlFor="name">שם משתמש:</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    defaultValue={currentUser?.username}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="budget">תקציב:</label>
                                <input
                                    type="number"
                                    id="budget"
                                    name="budget"
                                    defaultValue={currentUser?.budget}
                                    required
                                />
                            </div>
                            <div className="button-group">
                                <button type="submit">
                                    {currentUser ? 'עדכן' : 'הוסף'}
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setFormVisible(false);
                                        setCurrentUser(null);
                                    }}
                                >
                                    ביטול
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <LinkAccountsModal
                isOpen={isLinkModalOpen}
                onClose={() => setLinkModalOpen(false)}
                onSuccess={() => {
                    fetchLinkedAccounts();
                    setMessage('החשבונות קושרו בהצלחה');
                }}
                userRole={userRole}
            />
        </div>
    );
};

export default UserManagementPage;