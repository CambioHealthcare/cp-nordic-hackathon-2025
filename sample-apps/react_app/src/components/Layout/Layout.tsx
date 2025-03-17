import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/auth.service';
import styles from './Layout.module.css';

const Layout: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => {
    const navigate = useNavigate();
    const isAuthenticated = !!authService.getToken();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div>
            <nav className={styles.nav}>
                <ul className={styles.navList}>
                    {isAuthenticated ? (
                        <>
                            <li><Link to="/">Home</Link></li>
                            <li><button onClick={handleLogout}>Logout</button></li>
                        </>
                    ) : (
                        <li><Link to="/login">Login</Link></li>
                    )}
                </ul>
            </nav>
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
});

Layout.displayName = 'Layout';
export default Layout;
