export interface ExpenseCategory {
    category: string;
    amount: number;
    isRecurring: boolean;
}

export interface Expense {
    id: string;
    title: string;
    amount: number;
    category: string;
    date: string;
    isRecurring?: boolean;
    recurringDetails?: {
        frequency: 'monthly';
        nextDate: Date;
    };
}

export interface Alert {
    message: string;
    type: 'warning' | 'error' | 'info';
}

export interface PendingRequest {
    id: string;
    title: string;
    amount: number;
    category: string;
    date: string;
    status: 'pending' | 'approved' | 'rejected';
    childId: string;
    childName: string;
}

export interface DashboardData {
    currentBalance: number;
    totalExpenses: number;
    expensesByCategory: ExpenseCategory[];
    recentExpenses: Expense[];
    upcomingExpenses: Expense[];
    alerts: Alert[];
    pendingRequests: {
        count: number;
        items: PendingRequest[];
    };
}