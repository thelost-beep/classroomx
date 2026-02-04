import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './MainLayout.css';

const MainLayout: React.FC = () => {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const [isMemoriesOpen, setIsMemoriesOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const mainLinks = [
        { to: '/', icon: '🏠', label: 'Home Feed' },
        { to: '/directory', icon: '👥', label: 'Classmates' },
        { to: `/profile/${user?.id}`, icon: '👤', label: 'My Profile' },
    ];

    const socialLinks = [
        { to: '/create-post', icon: '✍️', label: 'Share' },
        { to: '/personal-space', icon: '📔', label: 'Journal' },
        { to: '/teacher-letters', icon: '✉️', label: 'Mail' },
    ];

    const memoryLinks = [
        { to: '/memory-vault', icon: '📸', label: 'Vault' },
        { to: '/confessions', icon: '🤐', label: 'Secrets' },
        { to: '/time-capsules', icon: '⏳', label: 'Capsules' },
    ];

    return (
        <div className={`main-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Desktop Sidebar */}
            <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    {!isSidebarCollapsed && <h1>ClassroomX</h1>}
                    <button
                        className="collapse-toggle"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        title={isSidebarCollapsed ? "Expand" : "Collapse"}
                    >
                        {isSidebarCollapsed ? '👉' : '👈'}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-group">
                        {!isSidebarCollapsed && <span className="group-label">Main</span>}
                        {mainLinks.map(item => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === '/'}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                {!isSidebarCollapsed && <span className="nav-label">{item.label}</span>}
                            </NavLink>
                        ))}
                    </div>

                    <div className="nav-group">
                        {!isSidebarCollapsed && <span className="group-label">Social</span>}
                        {socialLinks.map(item => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                {!isSidebarCollapsed && <span className="nav-label">{item.label}</span>}
                            </NavLink>
                        ))}
                    </div>

                    <div className="nav-group">
                        <button
                            className={`nav-item collapse-trigger ${isMemoriesOpen ? 'open' : ''}`}
                            onClick={() => {
                                if (isSidebarCollapsed) setIsSidebarCollapsed(false);
                                setIsMemoriesOpen(!isMemoriesOpen);
                            }}
                        >
                            <div className="trigger-main">
                                <span className="nav-icon">🎬</span>
                                {!isSidebarCollapsed && <span className="nav-label">Memories</span>}
                            </div>
                            {!isSidebarCollapsed && <span className="arrow">{isMemoriesOpen ? '▾' : '▸'}</span>}
                        </button>
                        <div className={`collapsible-group ${isMemoriesOpen && !isSidebarCollapsed ? 'expanded' : ''}`}>
                            {memoryLinks.map(item => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) => `nav-item sub-item ${isActive ? 'active' : ''}`}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    {!isSidebarCollapsed && <span className="nav-label">{item.label}</span>}
                                </NavLink>
                            ))}
                        </div>
                    </div>

                    <div className="nav-group mt-auto">
                        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <span className="nav-icon">⚙️</span>
                            {!isSidebarCollapsed && <span className="nav-label">Settings</span>}
                        </NavLink>
                        {profile?.role === 'admin' && (
                            <NavLink to="/admin" className={({ isActive }) => `nav-item admin-nav ${isActive ? 'active' : ''}`}>
                                <span className="nav-icon">🛡️</span>
                                {!isSidebarCollapsed && <span className="nav-label">Admin</span>}
                            </NavLink>
                        )}
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="avatar">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.name} className="avatar-img" />
                            ) : (
                                profile?.name?.[0]?.toUpperCase() || 'U'
                            )}
                        </div>
                        {!isSidebarCollapsed && (
                            <div className="user-info">
                                <span className="user-name">{profile?.name.split(' ')[0]}</span>
                                <button onClick={handleSignOut} className="sign-out-btn">Logout</button>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            <main className="main-content">
                <header className="mobile-header">
                    <h1>ClassroomX</h1>
                    {profile?.role === 'admin' && (
                        <NavLink to="/admin" className="mobile-admin-btn">🛡️</NavLink>
                    )}
                </header>

                <div className="content-inner">
                    <Outlet />
                </div>

                {/* Better Mobile Navigation */}
                <nav className="mobile-bottom-nav">
                    <NavLink to="/" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">🏠</span>
                        <span className="nav-text">Home</span>
                    </NavLink>
                    <NavLink to="/directory" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">👥</span>
                        <span className="nav-text">Batch</span>
                    </NavLink>
                    <NavLink to="/create-post" className="mobile-nav-item create-btn-mobile">
                        <div className="plus-icon">＋</div>
                    </NavLink>
                    <NavLink to={`/profile/${user?.id}`} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
                        <span className="nav-icon">👤</span>
                        <span className="nav-text">Profile</span>
                    </NavLink>
                    <button
                        className={`mobile-nav-item ${isMemoriesOpen ? 'active' : ''}`}
                        onClick={() => setIsMemoriesOpen(!isMemoriesOpen)}
                    >
                        <span className="nav-icon">🎬</span>
                        <span className="nav-text">More</span>
                    </button>

                    {/* Mobile Memories Overlay/Menu */}
                    {isMemoriesOpen && (
                        <div className="mobile-memories-menu animate-slideUp">
                            <div className="menu-header">
                                <h3>Memories</h3>
                                <button onClick={() => setIsMemoriesOpen(false)}>✕</button>
                            </div>
                            <div className="menu-grid">
                                {memoryLinks.map(link => (
                                    <NavLink
                                        key={link.to}
                                        to={link.to}
                                        className="menu-item"
                                        onClick={() => setIsMemoriesOpen(false)}
                                    >
                                        <span className="icon">{link.icon}</span>
                                        <span className="label">{link.label}</span>
                                    </NavLink>
                                ))}
                                {socialLinks.map(link => (
                                    <NavLink
                                        key={link.to}
                                        to={link.to}
                                        className="menu-item"
                                        onClick={() => setIsMemoriesOpen(false)}
                                    >
                                        <span className="icon">{link.icon}</span>
                                        <span className="label">{link.label}</span>
                                    </NavLink>
                                ))}
                                <NavLink to="/settings" className="menu-item" onClick={() => setIsMemoriesOpen(false)}>
                                    <span className="icon">⚙️</span>
                                    <span className="label">Settings</span>
                                </NavLink>
                            </div>
                        </div>
                    )}
                </nav>
            </main>
        </div>
    );
};

export default MainLayout;
