import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/ManageChildrenPage.css';
import { FaChild, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface Child {
    _id: string;
    name: string;
    monthlyBudget: number;
    requests: Request[];
}

interface Request {
    _id: string;
    childId: string;
    amount: number;
    description: string;
    category: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

const ManageChildrenPage: React.FC = () => {
    const [children, setChildren] = useState<Child[]>([]);
    const [showAddChildModal, setShowAddChildModal] = useState(false);
    const [newChildName, setNewChildName] = useState('');
    const [newChildBudget, setNewChildBudget] = useState('');
    const [responseMessage, setResponseMessage] = useState('');
    const [hasNewRequests, setHasNewRequests] = useState(false);

    useEffect(() => {
        fetchChildren();
        checkForNewRequests();
    }, []);

    const fetchChildren = async () => {
        try {
            const response = await axios.get('/api/children');
            setChildren(response.data);
        } catch (error) {
            console.error('Error fetching children:', error);
            toast.error('שגיאה בטעינת נתוני הילדים');
        }
    };

    const checkForNewRequests = async () => {
        try {
            const response = await axios.get('/api/children/requests/new');
            setHasNewRequests(response.data.hasNew);
            if (response.data.hasNew) {
                toast.info('יש בקשות חדשות ממתינות!');
            }
        } catch (error) {
            console.error('Error checking for new requests:', error);
        }
    };

    const handleAddChild = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('/api/children', {
                name: newChildName,
                monthlyBudget: parseFloat(newChildBudget)
            });
            toast.success('הילד נוסף בהצלחה');
            setShowAddChildModal(false);
            setNewChildName('');
            setNewChildBudget('');
            fetchChildren();
        } catch (error) {
            console.error('Error adding child:', error);
            toast.error('שגיאה בהוספת הילד');
        }
    };

    const handleRequestResponse = async (childId: string, requestId: string, status: 'approved' | 'rejected', message: string) => {
        try {
            await axios.put(`/api/children/requests/${requestId}`, {
                status,
                message
            });
            toast.success(status === 'approved' ? 'הבקשה אושרה' : 'הבקשה נדחתה');
            fetchChildren();
        } catch (error) {
            console.error('Error updating request:', error);
            toast.error('שגיאה בעדכון הבקשה');
        }
    };

    const updateChildBudget = async (childId: string, newBudget: number) => {
        try {
            await axios.put(`/api/children/${childId}/budget`, {
                monthlyBudget: newBudget
            });
            toast.success('התקציב עודכן בהצלחה');
            fetchChildren();
        } catch (error) {
            console.error('Error updating budget:', error);
            toast.error('שגיאה בעדכון התקציב');
        }
    };

    return (
        <div className="manage-children-page">
            <div className="page-header">
                <h1>ניהול ילדים</h1>
                <button className="add-child-button" onClick={() => setShowAddChildModal(true)}>
                    <FaChild /> הוסף ילד
                </button>
            </div>

            {hasNewRequests && (
                <div className="new-requests-alert">
                    יש בקשות חדשות ממתינות לאישור!
                </div>
            )}

            <div className="children-grid">
                {children.map(child => (
                    <div key={child._id} className="child-card">
                        <h3>{child.name}</h3>
                        <div className="child-details">
                            <p>תקציב חודשי: ₪{child.monthlyBudget}</p>
                            <div className="budget-update">
                                <input
                                    type="number"
                                    placeholder="תקציב חדש"
                                    onChange={(e) => {
                                        const newBudget = parseFloat(e.target.value);
                                        if (!isNaN(newBudget)) {
                                            updateChildBudget(child._id, newBudget);
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="requests-section">
                            <h4>בקשות ממתינות</h4>
                            {child.requests.filter(req => req.status === 'pending').map(request => (
                                <div key={request._id} className="request-card">
                                    <div className="request-header">
                                        <h5>{request.category}</h5>
                                        <span className="request-date">
                                            {new Date(request.createdAt).toLocaleDateString('he-IL')}
                                        </span>
                                    </div>
                                    <p className="request-description">{request.description}</p>
                                    <p className="request-amount">₪{request.amount}</p>
                                    <div className="request-actions">
                                        <button
                                            className="approve-button"
                                            onClick={() => {
                                                const message = prompt('הוסף הודעה (אופציונלי):') || '';
                                                handleRequestResponse(child._id, request._id, 'approved', message);
                                            }}
                                        >
                                            <FaCheckCircle /> אשר
                                        </button>
                                        <button
                                            className="reject-button"
                                            onClick={() => {
                                                const message = prompt('הוסף הודעה (אופציונלי):') || '';
                                                handleRequestResponse(child._id, request._id, 'rejected', message);
                                            }}
                                        >
                                            <FaTimesCircle /> דחה
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {showAddChildModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>הוסף ילד חדש</h2>
                        <form onSubmit={handleAddChild}>
                            <div className="form-group">
                                <label>שם הילד</label>
                                <input
                                    type="text"
                                    value={newChildName}
                                    onChange={(e) => setNewChildName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>תקציב חודשי</label>
                                <input
                                    type="number"
                                    value={newChildBudget}
                                    onChange={(e) => setNewChildBudget(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="modal-buttons">
                                <button type="submit">הוסף</button>
                                <button type="button" onClick={() => setShowAddChildModal(false)}>
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

export default ManageChildrenPage;
