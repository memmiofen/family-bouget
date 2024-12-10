import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaUser, FaLock, FaChild, FaUserTie } from 'react-icons/fa';
import '../styles/LoginPage.css';

interface ParentLoginResponse {
    token: string;
    user: {
        id: string;
        username: string;
        role: 'parent';
    };
}

interface ChildLoginResponse {
    token: string;
    child: {
        id: string;
        name: string;
        monthlyAllowance: number;
        remainingBudget: number;
    };
}

const API_URL = 'http://localhost:5004';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [isParentMode, setIsParentMode] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isParentMode && !formData.email) {
            toast.error('נא למלא את כל השדות');
            return;
        }

        if (!formData.password) {
            toast.error('נא להזין סיסמה');
            return;
        }

        try {
            setIsLoading(true);
            
            if (isParentMode) {
                // התחברות הורה
                const response = await axios.post<ParentLoginResponse>(`${API_URL}/api/auth/login`, {
                    email: formData.email,
                    password: formData.password
                });

                localStorage.setItem('token', response.data.token);
                localStorage.setItem('userId', response.data.user.id);
                localStorage.setItem('username', response.data.user.username);
                localStorage.setItem('role', 'parent');

                navigate('/dashboard');
                toast.success('התחברת בהצלחה!');
            } else {
                // התחברות ילד
                const response = await axios.post<ChildLoginResponse>(`${API_URL}/api/children/login`, {
                    password: formData.password
                });

                const { token, child } = response.data;

                localStorage.setItem('childToken', token);
                localStorage.setItem('childId', child.id);
                localStorage.setItem('childName', child.name);
                localStorage.setItem('role', 'child');

                navigate('/child-dashboard');
                toast.success('התחברת בהצלחה!');
            }
        } catch (error: any) {
            console.error('Login error:', error);
            const errorMessage = isParentMode
                ? 'שם משתמש או סיסמה שגויים'
                : 'סיסמה שגויה';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container" dir="rtl">
            <div className="login-card">
                <h1>ברוכים הבאים</h1>
                <p className="login-subtitle">התחבר למערכת ניהול תקציב המשפחה</p>

                <div className="user-type-toggle">
                    <button
                        className={`toggle-button ${isParentMode ? 'active' : ''}`}
                        onClick={() => setIsParentMode(true)}
                    >
                        <FaUserTie /> הורה
                    </button>
                    <button
                        className={`toggle-button ${!isParentMode ? 'active' : ''}`}
                        onClick={() => setIsParentMode(false)}
                    >
                        <FaChild /> ילד
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {isParentMode && (
                        <div className="form-group">
                            <label>
                                <FaUser className="input-icon" />
                                אימייל
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="הכנס את האימייל שלך"
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>
                            <FaLock className="input-icon" />
                            {isParentMode ? 'סיסמה' : 'הסיסמה שקיבלת מההורים'}
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder={isParentMode ? 'הכנס את הסיסמה שלך' : 'הכנס את הסיסמה שקיבלת'}
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'מתחבר...' : 'התחברות'}
                    </button>

                    {isParentMode && (
                        <p className="register-link">
                            אין לך חשבון עדיין?{' '}
                            <span onClick={() => navigate('/register')}>
                                הירשם כאן
                            </span>
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
};

export default LoginPage;