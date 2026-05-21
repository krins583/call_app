import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import './Dashboard.css';

import Navigation from './Navigation';
import History from './History';

const Dashboard = () => {
  // === STATES ===
  const [activeTab, setActiveTab] = useState('overview');
  const [allStudents, setAllStudents] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  
  // Theme State
  const [theme, setTheme] = useState('light');

  // Form & Upload State
  const [formData, setFormData] = useState({ name: '', phone: '', dob: '', batch: '', standard: '' });
  const [isUploading, setIsUploading] = useState(false);

  // Search, Filter, Sort & Pagination States
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // All, Pending, Completed
  const [sortBy, setSortBy] = useState('nameAsc'); // nameAsc, nameDesc, newFirst
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15; // Ek page par 15 students dikhenge

  // Bulk Actions State
  const [selectedStudents, setSelectedStudents] = useState([]);

  // === FIREBASE FETCH ===
  useEffect(() => {
    const qStudents = query(collection(db, 'students'), orderBy('name', 'asc'));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      setAllStudents(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    });

    const qHistory = query(collection(db, 'call_history'), orderBy('timestamp', 'desc'));
    const unsubHistory = onSnapshot(qHistory, (snapshot) => {
      setHistoryLogs(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    });

    return () => {
      unsubStudents();
      unsubHistory();
    };
  }, []);

  // === HANDLERS ===
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.batch || !formData.standard) {
      return alert('Bhai, Name, Phone, Batch aur Standard fields mandatory hain!');
    }
    try {
      await addDoc(collection(db, 'students'), {
        ...formData,
        isCallDone: false,
        createdAt: serverTimestamp(),
      });
      setFormData({ name: '', phone: '', dob: '', batch: '', standard: '' });
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        let successCount = 0;

        for (const row of jsonData) {
          const name = row.Name || row.name || row.NAME;
          const phone = row.Phone || row.phone || row.PHONE;
          const dob = row.DOB || row.dob || row.Dob || '';
          const batch = row.Batch || row.batch || row.BATCH || '';
          const standard = row.Standard || row.standard || row.Std || row.STANDARD || '';

          if (name && phone) {
            await addDoc(collection(db, 'students'), {
              name: String(name),
              phone: String(phone),
              dob: String(dob),
              batch: String(batch),
              standard: String(standard),
              isCallDone: false,
              createdAt: serverTimestamp(),
            });
            successCount++;
          }
        }
        alert(`${successCount} students successfully uploaded.`);
      } catch (error) {
        alert('Excel file parse karne mein error aayi.');
      } finally {
        setIsUploading(false);
        e.target.value = null;
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedStudents.length} students?`)) return;
    for (let id of selectedStudents) {
      await deleteDoc(doc(db, 'students', id));
    }
    setSelectedStudents([]);
  };

  const toggleSelectStudent = (id) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter(sid => sid !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  // === DATA PROCESSING (Filters, Sort, Pagination) ===
  let processedList = allStudents.filter((s) => (s.name || '').toLowerCase().includes(search.toLowerCase()));
  
  if (filterStatus === 'Pending') processedList = processedList.filter(s => !s.isCallDone);
  if (filterStatus === 'Completed') processedList = processedList.filter(s => s.isCallDone);

  processedList.sort((a, b) => {
    if (sortBy === 'nameAsc') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'nameDesc') return (b.name || '').localeCompare(a.name || '');
    if (sortBy === 'newFirst') return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
    return 0;
  });

  const totalPages = Math.ceil(processedList.length / itemsPerPage);
  const currentItems = processedList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const pendingCount = allStudents.filter((s) => !s.isCallDone).length;
  const completedCount = allStudents.filter((s) => s.isCallDone).length;

  const statCards = [
    { label: 'Total Students', value: allStudents.length, tone: 'blue' },
    { label: 'Pending Calls', value: pendingCount, tone: 'amber' },
    { label: 'Completed', value: completedCount, tone: 'green' },
    { label: 'History Logs', value: historyLogs.length, tone: 'pink' },
  ];

  const batchStats = allStudents.reduce((acc, student) => {
    const batch = student.batch || 'No Batch';
    if (!acc[batch]) acc[batch] = { name: batch, Total: 0, Completed: 0 };
    acc[batch].Total += 1;
    if (student.isCallDone) acc[batch].Completed += 1;
    return acc;
  }, {});
  
  const batchChartData = Object.values(batchStats);
  const pieData = [
    { name: 'Completed Calls', value: completedCount, color: '#12B76A' },
    { name: 'Pending Calls', value: pendingCount, color: '#F79009' }
  ];

  return (
    <div className="crm-shell" data-theme={theme}>
      <div className="crm-layout">
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} studentCount={allStudents.length} />

        <main className="main">
          {/* Header & Theme Toggle */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
            <button className="theme-toggle-btn" onClick={toggleTheme}>
              {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </button>
          </div>

          <section className="hero">
            <div className="hero-content">
              <div>
                <div className="eyebrow">Enterprise CRM Portal</div>
                <h1>Manage students and daily calling with clarity.</h1>
                <p>Add profiles, track pending calls, bulk update data, and review advanced analytics.</p>
              </div>
              <div className="live-pill">Firebase Live Sync</div>
            </div>
          </section>

          <section className="stats-grid">
            {statCards.map((card) => (
              <div className={`stat-card tone-${card.tone}`} key={card.label}>
                <div className="stat-icon">{card.value}</div>
                <div className="stat-value">{card.value}</div>
                <div className="stat-label">{card.label}</div>
              </div>
            ))}
          </section>

          {activeTab === 'overview' ? (
            <>
              {/* Analytics Section */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px', marginBottom: '22px' }}>
                <section className="panel" style={{ marginBottom: 0 }}>
                  <h3 className="panel-title">Batch Performance</h3>
                  <div style={{ width: '100%', height: 260, marginTop: '20px' }}>
                    <ResponsiveContainer>
                      <BarChart data={batchChartData}>
                        <XAxis dataKey="name" tick={{fontSize: 12, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 12, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{borderRadius: '14px', border: 'none', background: 'var(--bg-panel)', color: 'var(--text-main)'}} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 'bold'}} />
                        <Bar dataKey="Total" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="Completed" fill="#10B981" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
                <section className="panel" style={{ marginBottom: 0 }}>
                  <h3 className="panel-title">Overall Efficiency</h3>
                  <div style={{ width: '100%', height: 260, marginTop: '20px' }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={pieData} innerRadius={70} outerRadius={95} paddingAngle={5} dataKey="value" stroke="none">
                          {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{borderRadius: '14px', border: 'none', background: 'var(--bg-panel)', color: 'var(--text-main)'}} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 'bold'}} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </section>
              </div>

              {/* Add Student Form */}
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h3 className="panel-title">Add Student Profile</h3>
                    <p className="panel-subtitle">Manual entry ya Excel bulk upload se students add karein.</p>
                  </div>
                  <div>
                    <input type="file" accept=".xlsx, .xls, .csv" id="excel-upload" className="hidden-file-input" onChange={handleFileUpload} />
                    <label htmlFor="excel-upload" className="upload-label">{isUploading ? 'Uploading...' : 'Bulk Upload Excel'}</label>
                  </div>
                </div>
                <form className="form-grid" onSubmit={handleAddStudent}>
                  <div className="field"><label className="label">Name</label><input className="input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Full name" /></div>
                  <div className="field"><label className="label">Contact</label><input className="input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="9876543210" /></div>
                  <div className="field"><label className="label">Birth Date</label><input className="input" type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} /></div>
                  <div className="field">
                    <label className="label">Batch</label>
                    <select className="input" value={formData.batch} onChange={(e) => setFormData({...formData, batch: e.target.value})}>
                      <option value="">Select Batch</option>
                      {['2019-20','2020-21','2021-22','2022-23','2023-24','2024-25','2025-26','2026-27'].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="field"><label className="label">Standard</label><input className="input" value={formData.standard} onChange={(e) => setFormData({...formData, standard: e.target.value})} placeholder="e.g. 10th" /></div>
                  <button className="primary-button" type="submit">Save Profile</button>
                </form>
              </section>

              {/* Advanced Toolbar (Search, Filter, Sort) */}
              <div className="advanced-toolbar">
                <div className="section-label">Directory</div>
                <div className="toolbar-controls">
                  <input className="input search-input" placeholder="Search by name" value={search} onChange={(e) => {setSearch(e.target.value); setCurrentPage(1);}} />
                  <select className="input filter-select" value={filterStatus} onChange={(e) => {setFilterStatus(e.target.value); setCurrentPage(1);}}>
                    <option value="All">All Status</option>
                    <option value="Pending">Pending Calls</option>
                    <option value="Completed">Completed Calls</option>
                  </select>
                  <select className="input sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="nameAsc">Name (A-Z)</option>
                    <option value="nameDesc">Name (Z-A)</option>
                    <option value="newFirst">Newest First</option>
                  </select>
                </div>
              </div>

              {/* Bulk Actions Toolbar */}
              {selectedStudents.length > 0 && (
                <div className="bulk-toolbar">
                  <span>{selectedStudents.length} Students Selected</span>
                  <button className="remove-button" onClick={handleBulkDelete}>Delete Selected</button>
                </div>
              )}

              {/* Directory List */}
              <section className="directory-list">
                {currentItems.length === 0 ? (
                  <div className="empty-state">No students found.</div>
                ) : (
                  currentItems.map((s) => (
                    <div className="student-row" key={s.id}>
                      <input 
                        type="checkbox" 
                        className="custom-checkbox" 
                        checked={selectedStudents.includes(s.id)}
                        onChange={() => toggleSelectStudent(s.id)}
                      />
                      <div className="student-main">
                        <div className="avatar">{(s.name || 'S').charAt(0).toUpperCase()}</div>
                        <div className="student-info">
                          <div className="student-name">{s.name || 'Unknown'}</div>
                          <div className="student-dob">{s.dob || 'DOB N/A'} {s.standard ? ` | Std: ${s.standard}` : ''} {s.batch ? ` | Batch: ${s.batch}` : ''}</div>
                        </div>
                      </div>
                      <div className="muted">{s.phone || 'No phone'}</div>
                      <div className={`badge ${s.isCallDone ? 'done' : 'pending'}`}>{s.isCallDone ? 'Completed' : 'Pending'}</div>
                      <button className="remove-button" onClick={async () => { if (window.confirm('Delete student?')) await deleteDoc(doc(db, 'students', s.id)); }}>Remove</button>
                    </div>
                  ))
                )}
              </section>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Prev</button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
                </div>
              )}
            </>
          ) : (
            <History historyLogs={historyLogs} />
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;