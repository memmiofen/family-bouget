export interface UserProps {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: 'parent' | 'child';
    userId: string;
} 