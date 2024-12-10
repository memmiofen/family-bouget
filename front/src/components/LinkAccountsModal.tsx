// src/components/LinkAccountsModal.tsx
import React, { useState } from 'react';
import axios from 'axios';

interface LinkAccountsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    userRole: 'parent' | 'child';
}

const LinkAccountsModal: React.FC<LinkAccountsModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    userRole
}) => {
    const [linkCode, setLinkCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await axios.post(
                'http://localhost:5004/api/users/link-accounts',
                { linkCode },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            onSuccess();
            onClose();
        } catch (error: any) {
            setError(error.response?.data?.message || 'שגיאה בקישור החשבונות');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>קישור חשבונות</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="linkCode">קוד קישור:</label>
                        <input
                            type="text"
                            id="linkCode"
                            value={linkCode}
                            onChange={(e) => setLinkCode(e.target.value)}
                            placeholder="הזן את קוד הקישור שקיבלת"
                            required
                        />
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <div className="button-group">
                        <button 
                            type="submit" 
                            className="submit-button"
                            disabled={loading}
                        >
                            {loading ? 'מקשר...' : 'קשר חשבונות'}
                        </button>
                        <button 
                            type="button" 
                            className="cancel-button"
                            onClick={onClose}
                            disabled={loading}
                        >
                            ביטול
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LinkAccountsModal;