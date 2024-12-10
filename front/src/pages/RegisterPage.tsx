import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaUser, FaLock, FaEnvelope } from 'react-icons/fa';
import '../styles/RegisterPage.css';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
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

        if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
            toast.error('נא למלא את כל השדות');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('הסיסמאות אינן תואמות');
            return;
        }

        try {
            setIsLoading(true);
            const response = await axios.post('http://localhost:5004/api/auth/register', {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                role: 'parent'
            });

            if (response.data?.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('userId', response.data.user.id);
                localStorage.setItem('username', response.data.user.username);
                localStorage.setItem('role', 'parent');
                
                navigate('/dashboard');
                toast.success('נרשמת בהצלחה!');
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            const errorMessage = error.response?.data?.message || 'שגיאה בהרשמה';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="register-container" dir="rtl">
            <div className="register-card">
                <h1>הרשמה</h1>
                <p className="register-subtitle">הצטרף למערכת ניהול תקציב המשפחה</p>

                <form onSubmit={handleSubmit} className="register-form">
                    <div className="form-group">
                        <label>
                            <FaUser className="input-icon" />
                            שם משתמש
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="הכנס שם משתמש"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            <FaEnvelope className="input-icon" />
                            אימייל
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="הכנס כתובת אימייל"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            <FaLock className="input-icon" />
                            סיסמה
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="בחר סיסמה"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            <FaLock className="input-icon" />
                            אימות סיסמה
                        </label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="הכנס את הסיסמה שוב"
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="register-button"
                        disabled={isLoading}
                    >
                        {isLoading ? 'נרשם...' : 'הרשמה'}
                    </button>

                    <p className="login-link">
                        כבר יש לך חשבון?{' '}
                        <span onClick={() => navigate('/login')}>
                            התחבר כאן
                        </span>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;