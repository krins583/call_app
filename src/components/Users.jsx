import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import './Users.css';

const Users = () => {
  const [usersList, setUsersList] = useState([]);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    password: '', 
    role: 'Caller', 
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showPasswordMap, setShowPasswordMap] = useState({});

  useEffect(() => {
    const q = query(collection(db, 'app_users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setUsersList(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    });
    return () => unsub();
  }, []);

  // Summary Stats Logic
  const stats = useMemo(() => {
    const active = usersList.filter(u => u.isActive).length;
    const admins = usersList.filter(u => u.role === 'Admin' || u.role === 'Manager').length;
    return { total: usersList.length, active, admins };
  }, [usersList]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.mobile || !formData.email || !formData.password) {
      alert("First Name, Mobile, Email aur Password mandatory hain!");
      return;
    }

    try {
      if (isEditing) {
        await updateDoc(doc(db, 'app_users', editId), {
          ...formData,
        });
        setIsEditing(false);
        setEditId(null);
      } else {
        await addDoc(collection(db, 'app_users'), {
          ...formData,
          isActive: true, 
          createdAt: serverTimestamp(),
        });
      }
      setFormData({ firstName: '', lastName: '', mobile: '', email: '', password: '', role: 'Caller' });
    } catch (err) {
      alert("Error saving user: " + err.message);
    }
  };

  const handleEdit = (user) => {
    setIsEditing(true);
    setEditId(user.id);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      mobile: user.mobile || '',
      email: user.email || '',
      password: user.password || '', 
      role: user.role || 'Caller',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      await deleteDoc(doc(db, 'app_users', id));
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    await updateDoc(doc(db, 'app_users', id), {
      isActive: !currentStatus,
    });
  };

  const handleResetPassword = async (id) => {
    const newPass = window.prompt("Enter a new password for this user:");
    if (newPass && newPass.trim() !== "") {
      try {
        await updateDoc(doc(db, 'app_users', id), {
          password: newPass.trim()
        });
        alert("Password successfully reset ho gaya!");
      } catch (err) {
        alert("Error resetting password: " + err.message);
      }
    }
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswordMap(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <section className="panel users-panel premium-layout">
      
      {/* Top Header & Summary Cards */}
      <div className="users-topbar">
        <div>
          <h3 className="panel-title">Team Management</h3>
          <p className="panel-subtitle">Staff aur Caller accounts ko manage karein aur unka access control karein.</p>
        </div>
      </div>

      <div className="users-summary-row premium-grid">
        <div className="users-summary-card premium-stat-card">
          <div className="stat-icon-wrapper blue">👥</div>
          <div className="stat-content">
            <span>Total Users</span>
            <strong>{stats.total}</strong>
          </div>
        </div>
        <div className="users-summary-card premium-stat-card">
          <div className="stat-icon-wrapper green">🟢</div>
          <div className="stat-content">
            <span>Active Accounts</span>
            <strong>{stats.active}</strong>
          </div>
        </div>
        <div className="users-summary-card premium-stat-card wide">
          <div className="stat-icon-wrapper purple">🛡️</div>
          <div className="stat-content">
            <span>Admins / Managers</span>
            <strong>{stats.admins}</strong>
          </div>
        </div>
      </div>

      {/* Premium User Form */}
      <div className="user-form-container premium-form-box">
        <div className="form-header-row">
          <div className="form-icon">{isEditing ? '✏️' : '✨'}</div>
          <h4 className="form-heading">{isEditing ? 'Update Team Member' : 'Register New Member'}</h4>
        </div>
        
        <form className="user-form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label className="label">First Name</label>
            <input className="input premium-input" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} placeholder="e.g. Krins" />
          </div>
          <div className="field">
            <label className="label">Last Name</label>
            <input className="input premium-input" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} placeholder="e.g. Sutariya" />
          </div>
          <div className="field">
            <label className="label">Mobile Number</label>
            <input className="input premium-input" value={formData.mobile} onChange={(e) => setFormData({...formData, mobile: e.target.value})} placeholder="9876543210" />
          </div>
          <div className="field">
            <label className="label">Email ID (Login ID)</label>
            <input className="input premium-input" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="name@company.com" />
          </div>
          <div className="field">
            <label className="label">Login Password</label>
            <input className="input premium-input" type="text" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="Enter secure password" />
          </div>
          <div className="field">
            <label className="label">Access Role</label>
            <select className="input premium-input" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
              <option value="Admin">Admin</option>
              <option value="Caller">Caller (Staff)</option>
              <option value="Manager">Manager</option>
            </select>
          </div>

          <div className="user-form-actions">
            <button className="primary-button user-submit-btn premium-btn" type="submit">
              {isEditing ? 'Save Changes' : 'Create Account'}
            </button>
            {isEditing && (
              <button 
                type="button" 
                className="cancel-btn premium-btn-outline" 
                onClick={() => {
                  setIsEditing(false);
                  setFormData({ firstName: '', lastName: '', mobile: '', email: '', password: '', role: 'Caller' });
                }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Users List Grid */}
      <div className="users-list-section">
        <div className="list-header-row">
          <h4 className="list-heading">Directory ({usersList.length} Accounts)</h4>
        </div>
        
        <div className="users-grid">
          {usersList.length === 0 ? (
            <div className="empty-state premium-empty">No users found. Create a new account above.</div>
          ) : (
            usersList.map(user => (
              <div className={`user-card premium-user-card ${!user.isActive ? 'inactive-card' : ''}`} key={user.id}>
                
                <div className="user-card-header">
                  <div className="user-avatar premium-avatar">
                    {(user.firstName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info-head">
                    <h5 className="user-fullname">{user.firstName} {user.lastName}</h5>
                    <span className={`user-role-badge role-${(user.role || 'caller').toLowerCase()}`}>
                      {user.role || 'Caller'}
                    </span>
                  </div>
                </div>

                <div className="user-details-body">
                  <div className="detail-row">
                    <div className="icon-box blue-soft">📧</div> 
                    <span className="text">{user.email}</span>
                  </div>
                  <div className="detail-row">
                    <div className="icon-box green-soft">📞</div> 
                    <span className="text">{user.mobile}</span>
                  </div>
                  <div className="detail-row">
                    <div className="icon-box orange-soft">🔒</div> 
                    <span className="text password-text" style={{ letterSpacing: showPasswordMap[user.id] ? 'normal' : '2px' }}>
                      {showPasswordMap[user.id] ? (user.password || 'N/A') : '••••••••'}
                    </span>
                    <button className="toggle-pass-btn premium-toggle" onClick={() => togglePasswordVisibility(user.id)}>
                      {showPasswordMap[user.id] ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="user-card-footer">
                  <button 
                    className={`status-toggle-btn premium-status ${user.isActive ? 'active-status' : 'inactive-status'}`}
                    onClick={() => toggleStatus(user.id, user.isActive)}
                  >
                    <span className="dot"></span> {user.isActive ? 'Active' : 'Inactive'}
                  </button>

                  <div className="action-buttons premium-actions">
                    <button className="action-icon-btn reset-btn" onClick={() => handleResetPassword(user.id)} title="Reset Password">🔑</button>
                    <button className="action-icon-btn edit-btn" onClick={() => handleEdit(user)} title="Edit">✏️</button>
                    <button className="action-icon-btn delete-btn" onClick={() => handleDelete(user.id)} title="Delete">🗑️</button>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

    </section>
  );
};

export default Users;