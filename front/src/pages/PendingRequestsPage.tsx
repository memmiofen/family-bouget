import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/PendingRequestsPage.css';

interface Request {
    _id: string;
    childId: {
        username: string;
    };
    amount: number;
    description: string;
    category: string;
    status: string;
    requestDate: string;
    transferMethod?: string;
    transferDetails?: string;
}

const PendingRequestsPage: React.FC = () => {
    const [requests, setRequests] = useState<Request[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
    const [transferMethod, setTransferMethod] = useState('');
    const [transferDetails, setTransferDetails] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5004/api/requests', {
                params: { status: 'pending' },
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setRequests(response.data);
        } catch (error) {
            setError('שגיאה בטעינת הבקשות');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleResponse = async (requestId: string, status: 'approved' | 'rejected') => {
        try {
            if (status === 'approved' && (!transferMethod || !transferDetails)) {
                setError('נא למלא את כל פרטי ההעברה');
                return;
            }

            const data = status === 'approved'
                ? { status, transferMethod, transferDetails }
                : { status };

            await axios.post(
                `http://localhost:5004/api/requests/${requestId}/respond`,
                data,
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );

            // רענון הדשבורד
            await axios.get(
                `http://localhost:5004/api/dashboard/refreshDashboard/${localStorage.getItem('userId')}`,
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                }
            );

            setSelectedRequest(null);
            setTransferMethod('');
            setTransferDetails('');
            setError('');
            fetchRequests();

        } catch (error: any) {
            setError(error.response?.data?.error || 'שגיאה בטיפול בבקשה');
            console.error(error);
        }
    };

    if (loading) return <div>טוען...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="pending-requests-container">
            <h1>בקשות ממתינות</h1>
            {requests.length === 0 ? (
                <p className="no-requests">אין בקשות ממתינות</p>
            ) : (
                <div className="requests-list">
                    {requests.map(request => (
                        <div key={request._id} className="request-card">
                            <div className="request-header">
                                <h3>בקשה מאת: {request.childId.username}</h3>
                                <span className="amount">₪{request.amount.toLocaleString()}</span>
                            </div>
                            <p className="description">{request.description}</p>
                            <p className="date">
                                {new Date(request.requestDate).toLocaleDateString('he-IL')}
                            </p>

                            <div className="actions">
                                <button
                                    className="approve-button"
                                    onClick={() => setSelectedRequest(request)}
                                >
                                    אישור
                                </button>
                                <button
                                    className="reject-button"
                                    onClick={() => handleResponse(request._id, 'rejected')}
                                >
                                    דחייה
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedRequest && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>אישור בקשה</h2>
                        <select
                            value={transferMethod}
                            onChange={(e) => setTransferMethod(e.target.value)}
                            required
                        >
                            <option value="">בחר אופן העברה</option>
                            <option value="cash">מזומן</option>
                            <option value="bank">העברה בנקאית</option>
                            <option value="location">השארת כסף במיקום</option>
                            <option value="other">אחר</option>
                        </select>

                        <textarea
                            value={transferDetails}
                            onChange={(e) => setTransferDetails(e.target.value)}
                            placeholder="פרטי העברה (למשל: השארתי מתחת למיטה)"
                            required
                        />

                        <div className="modal-actions">
                            <button
                                onClick={() => handleResponse(selectedRequest._id, 'approved')}
                                disabled={!transferMethod || !transferDetails}
                            >
                                אישור העברה
                            </button>
                            <button onClick={() => setSelectedRequest(null)}>
                                ביטול
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingRequestsPage; 