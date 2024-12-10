import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/ChildLoginPage.css';

const API_URL = 'http://localhost:5004';

const ChildLoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            toast.error('נא להזין סיסמה');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/children/login`, { password });
            const { token, child } = response.data;

            // שמירת הטוקן ומזהה הילד
            localStorage.setItem('childToken', token);
            localStorage.setItem('childId', child.id);
            localStorage.setItem('childName', child.name);

            toast.success('התחברת בהצלחה!');
            navigate('/child-dashboard');
        } catch (error) {
            console.error('Login error:', error);
            toast.error('סיסמה שגויה');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="child-login-page">
            <div className="login-container">
                <h1>התחברות ילדים</h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>סיסמה:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="הכנס את הסיסמה שלך"
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? 'מתחבר...' : 'התחבר'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChildLoginPage;
