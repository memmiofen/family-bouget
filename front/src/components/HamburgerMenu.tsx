import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HamburgerMenu.css';

interface HamburgerMenuProps {
    userRole: string | null;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ userRole }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const menuItems = [
        { title: 'דף הבית', path: '/dashboard' },
        { title: 'הוספת הוצאה', path: '/expenses/add' },
        { title: 'היסטוריית הוצאות', path: '/expenses/history' },
        { title: 'הוספת הכנסה', path: '/income/add' },
        { title: 'הוצאות קבועות', path: '/expenses/fixed' },
    ];

    if (userRole === 'parent') {
        menuItems.push({ title: 'בקשות ממתינות', path: '/requests' });
    }

    const handleNavigation = (path: string) => {
        navigate(path);
        setIsOpen(false);
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
        setIsOpen(false);
    };

    const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            setIsOpen(false);
        }
    };

    return (
        <>
            {isOpen && <div className="menu-overlay" onClick={handleClickOutside} />}
            <div className="hamburger-menu">
                <button 
                    className={`hamburger-button ${isOpen ? 'open' : ''}`} 
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                {isOpen && (
                    <div className="menu-items">
                        {menuItems.map((item, index) => (
                            <button 
                                key={index}
                                onClick={() => handleNavigation(item.path)}
                            >
                                {item.title}
                            </button>
                        ))}
                        <button onClick={handleLogout} className="logout-button">
                            התנתק
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default HamburgerMenu; 