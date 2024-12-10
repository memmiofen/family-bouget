// src/pages/SignupPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosInstance from '../api/axiosInstance';
import { AxiosError } from 'axios';

interface SignupFormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  role: 'parent' | 'child';
}

interface SignupResponse {
  token: string;
  user: {
    username: string;
    email: string;
    role: string;
  };
}

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    role: 'child' as 'parent' | 'child',
  });
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.username) {
      toast.warning('נא למלא את כל השדות');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('נא להזין כתובת דוא"ל תקינה');
      return false;
    }

    if (formData.password.length < 6) {
      toast.error('הסיסמה חייבת להכיל לפחות 6 תווים');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.post('/auth/signup', formData);

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.user.id);
      localStorage.setItem('username', response.data.user.username);
      localStorage.setItem('userRole', response.data.user.role);

      toast.success('נרשמת בהצלחה!');
      navigate('/dashboard');
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 409) {
        toast.error('משתמש עם אימייל זה כבר קיים במערכת');
      } else {
        toast.error('שגיאה בהרשמה, נסה שוב מאוחר יותר');
      }
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <div className="signup-container">
      <h1 className="text-2xl font-bold mb-6">הרשמה למערכת</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <input
            type="text"
            name="username"
            placeholder="שם משתמש"
            value={formData.username}
            onChange={handleInputChange}
            className="input-field"
          />
        </div>

        <div className="form-group">
          <input
            type="email"
            name="email"
            placeholder="דוא״ל"
            value={formData.email}
            onChange={handleInputChange}
            className="input-field"
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            name="password"
            placeholder="סיסמה"
            value={formData.password}
            onChange={handleInputChange}
            className="input-field"
          />
        </div>

        <div className="form-group">
          <select
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="role-select"
          >
            <option value="parent">הורה</option>
            <option value="child">ילד</option>
          </select>
        </div>

        <button type="submit" className="signup-button" disabled={loading}>
          {loading ? 'נרשם...' : 'הרשמה'}
        </button>

        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="secondary-button"
          >
            יש לך כבר חשבון? התחבר
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignupPage;
