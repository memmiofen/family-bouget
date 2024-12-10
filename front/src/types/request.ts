export interface Request {
    _id: string;
    childId: {
        _id: string;
        username: string;
    };
    parentId: string;
    amount: number;
    description: string;
    category?: string;
    requestDate: Date;
    status: 'pending' | 'approved' | 'rejected';
    transferMethod?: string;
    transferDetails?: string;
} 