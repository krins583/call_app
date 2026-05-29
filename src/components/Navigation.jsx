import React from 'react';
import './Navigation.css';

const Navigation = ({ activeTab, setActiveTab, studentCount }) => {
  return (
    <aside className="sidebar">
      <div className="brand-mark">K</div>
      <h2 className="brand-title">Krins CRM</h2>
      <p className="brand-subtitle">
        Student directory, call progress aur interaction history ek clean workspace me.
      </p>

      <nav className="nav-menu">
        <button
          className={`nav-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <span className="nav-dot" />
          Dashboard
        </button>

        <button
          className={`nav-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <span className="nav-dot" />
          Call History
        </button>

        {/* NAYA: App Users Tab */}
        <button
          className={`nav-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <span className="nav-dot" />
          App Users
        </button>
      </nav>

      <div className="sidebar-footer">
        <strong>{studentCount}</strong>
        <span>Active students synced from Firebase</span>
      </div>
    </aside>
  );
};

export default Navigation;