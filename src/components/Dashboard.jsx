import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import './Dashboard.css';

import Navigation from './Navigation';
import History from './History';
import Users from './Users';

const Dashboard = () => {
  // === STATES ===
  const [activeTab, setActiveTab] = useState('overview');
  const [allStudents, setAllStudents] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  
  // Theme State
  const [theme, setTheme] = useState('light');

  // Form State
  const [formData, setFormData] = useState({ name: '', phone: '', dob: '', batch: '', standard: '', city: '' });
  const [isUploading, setIsUploading] = useState(false);

  // Search, Filter, Sort & Pagination States
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); 
  const [filterBatch, setFilterBatch] = useState('All'); // NAYA: Batch Filter
  const [filterMonth, setFilterMonth] = useState('All'); // NAYA: Month Filter
  const [sortBy, setSortBy] = useState('nameAsc'); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [selectedStudents, setSelectedStudents] = useState([]);

  // === Edit Profile States ===
  const [editingStudent, setEditingStudent] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editPhotoFile, setEditPhotoFile] = useState(null);

  // === Assign Calls State ===
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignData, setAssignData] = useState({ eventTitle: 'Daily Follow-up', callerEmail: '', callerName: '' });

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

  // NAYA: Jab bhi filter change ho, selections clear kar do taaki galat delete na ho
  useEffect(() => {
    setSelectedStudents([]);
  }, [search, filterStatus, filterBatch, filterMonth]);

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
      setFormData({ name: '', phone: '', dob: '', batch: '', standard: '', city: '' });
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
          const name = row.Name || row.name || row.NAME || '';
          const phone = row.Phone || row.phone || row.PHONE || row.Contact || row.contact || '';
          let dob = row.DOB || row.dob || row.Dob || '';
          const batch = row.Batch || row.batch || row.BATCH || '';
          const standard = row.Standard || row.standard || row.Std || row.STANDARD || '';
          const city = row.City || row.city || row.CITY || '';

          if (typeof dob === 'number') {
            const jsDate = new Date((dob - 25569) * 86400 * 1000);
            const yyyy = jsDate.getFullYear();
            const mm = String(jsDate.getMonth() + 1).padStart(2, '0');
            const dd = String(jsDate.getDate()).padStart(2, '0');
            dob = `${yyyy}-${mm}-${dd}`;
          }

          if (name || phone || dob || batch || standard || city) {
            await addDoc(collection(db, 'students'), {
              name: String(name),
              phone: String(phone),
              dob: String(dob),
              batch: String(batch),
              standard: String(standard),
              city: String(city),
              isCallDone: false,
              createdAt: serverTimestamp(),
            });
            successCount++;
          }
        }
        alert(`${successCount} records successfully uploaded.`);
      } catch (error) {
        alert('Excel file parse karne mein error aayi: ' + error.message);
      } finally {
        setIsUploading(false);
        e.target.value = null;
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedStudents.length} students?`)) return;
    try {
      // Bulk Delete fast karne ke liye Promise.all
      await Promise.all(selectedStudents.map(id => deleteDoc(doc(db, 'students', id))));
      setSelectedStudents([]);
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
  };

  const toggleSelectStudent = (id) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter(sid => sid !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  const handleAssignCalls = async (e) => {
    e.preventDefault();
    if (!assignData.callerEmail || !assignData.callerName) {
      return alert("Caller ka Email aur Name dono zaroori hain!");
    }

    try {
      const batch = writeBatch(db);
      const selectedDocs = allStudents.filter(s => selectedStudents.includes(s.id));

      selectedDocs.forEach(student => {
        const docRef = doc(collection(db, 'event_assignments'));
        batch.set(docRef, {
          eventId: 'direct_assign_' + Date.now(),
          eventTitle: assignData.eventTitle,
          callerEmail: assignData.callerEmail.trim().toLowerCase(),
          callerName: assignData.callerName,
          studentId: student.id,
          studentName: student.name || 'Unknown',
          studentPhone: student.phone || '',
          batch: student.batch || '',
          isCallDone: false,
          feedback: '',
          assignedAt: serverTimestamp(),
        });
      });

      await batch.commit();
      alert(`Success! ${selectedDocs.length} calls successfully assigned to ${assignData.callerName}.`);
      setIsAssignModalOpen(false);
      setSelectedStudents([]); 
      setAssignData({ eventTitle: 'Daily Follow-up', callerEmail: '', callerName: '' });
    } catch (err) {
      alert("Assignment error: " + err.message);
    }
  };

  const uploadPhotoToImgBB = async (file) => {
    const form = new FormData();
    form.append('image', file);
    const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY; 
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (data.success) return data.data.url;
      return null;
    } catch (err) {
      console.error('ImgBB Upload Error:', err);
      return null;
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      let finalPhotoUrl = editingStudent.photoUrl || '';
      
      if (editPhotoFile) {
        const uploadedUrl = await uploadPhotoToImgBB(editPhotoFile);
        if (uploadedUrl) {
          finalPhotoUrl = uploadedUrl;
        } else {
          alert("Photo upload fail ho gayi. Baaki details save ho jayengi.");
        }
      }

      const studentRef = doc(db, 'students', editingStudent.id);
      await updateDoc(studentRef, {
        name: editingStudent.name,
        phone: editingStudent.phone,
        dob: editingStudent.dob,
        batch: editingStudent.batch,
        standard: editingStudent.standard,
        city: editingStudent.city,
        photoUrl: finalPhotoUrl
      });
      
      setEditingStudent(null);
      setEditPhotoFile(null);
    } catch (err) {
      alert('Error updating student: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // === DATA PROCESSING & FILTERS ===
  let processedList = allStudents.filter((s) => (s.name || '').toLowerCase().includes(search.toLowerCase()));
  if (filterStatus === 'Pending') processedList = processedList.filter(s => !s.isCallDone);
  if (filterStatus === 'Completed') processedList = processedList.filter(s => s.isCallDone);

  // NAYA: Batch Filter Logic
  if (filterBatch !== 'All') processedList = processedList.filter(s => s.batch === filterBatch);
  
  // NAYA: Month Filter Logic
  if (filterMonth !== 'All') {
    processedList = processedList.filter(s => {
      if (!s.dob || !s.dob.includes('-')) return false;
      const month = s.dob.split('-')[1]; // YYYY-MM-DD format se mahina (MM) nikalna
      return month === filterMonth;
    });
  }

  processedList.sort((a, b) => {
    if (sortBy === 'nameAsc') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'nameDesc') return (b.name || '').localeCompare(a.name || '');
    if (sortBy === 'newFirst') return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
    return 0;
  });

  // NAYA: Select All Functionality
  const isAllSelected = processedList.length > 0 && selectedStudents.length === processedList.length;
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(processedList.map(s => s.id));
    }
  };

  const uniqueBatches = [...new Set(allStudents.map(s => s.batch).filter(Boolean))].sort();

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
          <header className="page-header">
            <div>
              <h1 className="page-title">Enterprise Dashboard</h1>
              <p className="page-subtitle">Overview of your daily calls, student profiles, and analytics.</p>
            </div>
            <div className="header-actions">
              <div className="live-pill"><span className="pulse-dot"></span> Firebase Live</div>
              <button className="theme-toggle-btn" onClick={toggleTheme}>
                {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </button>
            </div>
          </header>

          <section className="stats-grid">
            {statCards.map((card) => (
              <div className={`stat-card tone-${card.tone}`} key={card.label}>
                <div className="stat-card-header"><div className="stat-icon"></div></div>
                <div className="stat-value">{card.value}</div>
                <div className="stat-label">{card.label}</div>
              </div>
            ))}
          </section>

          {activeTab === 'overview' && (
            <>
              <div className="content-grid">
                <section className="panel form-panel">
                  <div className="panel-header-compact">
                    <h3 className="panel-title">Add Profile</h3>
                    <div>
                      <input type="file" accept=".xlsx, .xls, .csv" id="excel-upload" className="hidden-file-input" onChange={handleFileUpload} />
                      <label htmlFor="excel-upload" className="upload-label-small">{isUploading ? 'Uploading...' : 'Bulk Upload'}</label>
                    </div>
                  </div>
                  
                  <form className="form-grid-compact" onSubmit={handleAddStudent}>
                    <div className="field"><label className="label">Name</label><input className="input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Full name" /></div>
                    <div className="field"><label className="label">Contact</label><input className="input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="9876543210" /></div>
                    <div className="field"><label className="label">Birth Date</label><input className="input" type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} /></div>
                    <div className="field">
                      <label className="label">Batch</label>
                      <select className="input" value={formData.batch} onChange={(e) => setFormData({...formData, batch: e.target.value})}>
                        <option value="">Select</option>
                        {['2019-20','2020-21','2021-22','2022-23','2023-24','2024-25','2025-26','2026-27'].map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="field"><label className="label">Standard</label><input className="input" value={formData.standard} onChange={(e) => setFormData({...formData, standard: e.target.value})} placeholder="e.g. 10th" /></div>
                    <div className="field"><label className="label">City (Opt)</label><input className="input" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="e.g. Ahmedabad" /></div>
                    <button className="primary-button submit-btn-full" type="submit">Save Student Profile</button>
                  </form>
                </section>

                <div className="charts-row">
                  <section className="panel chart-panel">
                    <h3 className="panel-title-small">Batch Performance</h3>
                    <div className="chart-wrapper">
                      <ResponsiveContainer>
                        <BarChart data={batchChartData}>
                          <XAxis dataKey="name" tick={{fontSize: 10, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
                          <YAxis width={25} tick={{fontSize: 10, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
                          <Tooltip cursor={{fill: 'var(--bg-hover)'}} contentStyle={{borderRadius: '8px', border: 'none', background: 'var(--bg-panel)', color: 'var(--text-main)', fontSize: '12px'}} />
                          <Bar dataKey="Total" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={15} />
                          <Bar dataKey="Completed" fill="#10B981" radius={[4, 4, 0, 0]} barSize={15} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                  <section className="panel chart-panel">
                    <h3 className="panel-title-small">Overall Efficiency</h3>
                    <div className="chart-wrapper">
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={pieData} innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value" stroke="none">
                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                          </Pie>
                          <Tooltip contentStyle={{borderRadius: '8px', border: 'none', background: 'var(--bg-panel)', color: 'var(--text-main)', fontSize: '12px'}} />
                          <Legend iconType="circle" wrapperStyle={{fontSize: '11px', fontWeight: 'bold'}} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                </div>
              </div>

              <div className="advanced-toolbar" style={{ flexWrap: 'wrap' }}>
                <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  Directory List
                  
                  {/* NAYA: Select All Filtered Checkbox */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', color: 'var(--primary)' }}>
                    <input 
                      type="checkbox" 
                      className="custom-checkbox" 
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                    />
                    Select All Filtered
                  </label>
                </div>
                
                <div className="toolbar-controls" style={{ flexWrap: 'wrap' }}>
                  <input className="input search-input" placeholder="Search by name..." value={search} onChange={(e) => {setSearch(e.target.value); setCurrentPage(1);}} />
                  
                  {/* NAYA: Batch Filter Dropdown */}
                  <select className="input filter-select" value={filterBatch} onChange={(e) => {setFilterBatch(e.target.value); setCurrentPage(1);}}>
                    <option value="All">All Batches</option>
                    {uniqueBatches.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>

                  {/* NAYA: Birthday Month Dropdown */}
                  <select className="input filter-select" value={filterMonth} onChange={(e) => {setFilterMonth(e.target.value); setCurrentPage(1);}}>
                    <option value="All">All Birthdays</option>
                    <option value="01">January</option>
                    <option value="02">February</option>
                    <option value="03">March</option>
                    <option value="04">April</option>
                    <option value="05">May</option>
                    <option value="06">June</option>
                    <option value="07">July</option>
                    <option value="08">August</option>
                    <option value="09">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>

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

              {selectedStudents.length > 0 && (
                <div className="bulk-toolbar">
                  <span>{selectedStudents.length} Students Selected</span>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      className="primary-button" 
                      style={{ height: '34px', fontSize: '12px', padding: '0 14px', borderRadius: '11px' }} 
                      onClick={() => setIsAssignModalOpen(true)}
                    >
                      👤 Assign Calls
                    </button>
                    
                    <button className="remove-button-bulk" onClick={handleBulkDelete}>
                      ✕ Delete
                    </button>
                  </div>
                </div>
              )}

              <section className="directory-list">
                {currentItems.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📂</div>
                    <div className="empty-text">No students found.</div>
                  </div>
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
                        <div 
                          className={`avatar ${s.isCallDone ? 'avatar-done' : 'avatar-pending'}`}
                          style={s.photoUrl ? { backgroundImage: `url(${s.photoUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                        >
                          {s.photoUrl ? '' : (s.name || 'S').charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="student-info">
                          <div className="student-name">{s.name || 'Unknown Profile'}</div>
                          <div className="student-details">
                            {s.dob ? `DOB: ${s.dob}` : 'DOB N/A'} 
                            {s.standard && <span>{s.standard}</span>}
                            {s.batch && <span>{s.batch}</span>}
                            {s.city && <span>{s.city}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="muted">{s.phone || 'No phone'}</div>
                      <div className={`badge ${s.isCallDone ? 'done' : 'pending'}`}>{s.isCallDone ? 'Completed' : 'Pending'}</div>
                      
                      <div className="action-buttons">
                        <button 
                          className="icon-edit-button" 
                          style={{ background: '#FFF4E5', color: '#F79009' }}
                          onClick={() => {
                            const link = `${window.location.origin}/call_app/#/update-profile?id=${s.id}`;
                            navigator.clipboard.writeText(link);
                            alert('Link copied! Ab aap isko WhatsApp par send kar sakte hain.');
                          }} 
                          title="Copy Update Link"
                        >
                          🔗
                        </button>
                        
                        <button className="icon-edit-button" onClick={() => setEditingStudent(s)} title="Edit Profile">
                          ✎
                        </button>
                        <button className="icon-delete-button" onClick={async () => { if (window.confirm('Delete student?')) await deleteDoc(doc(db, 'students', s.id)); }} title="Delete">
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </section>

              {totalPages > 1 && (
                <div className="pagination">
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>← Prev</button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Next →</button>
                </div>
              )}
            </>
          )}

          {activeTab === 'history' && <History historyLogs={historyLogs} />}
          {activeTab === 'users' && <Users />}
          
        </main>
      </div>

      {/* === Edit Modal Overlay === */}
      {editingStudent && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <div className="edit-modal-header">
              <h2>Edit Profile</h2>
              <button className="close-modal-btn" onClick={() => { setEditingStudent(null); setEditPhotoFile(null); }}>✕</button>
            </div>

            <form className="form-grid-compact" onSubmit={handleUpdateStudent}>
              <div className="field">
                <label className="label">Name</label>
                <input className="input" value={editingStudent.name} onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})} required />
              </div>
              <div className="field">
                <label className="label">Phone</label>
                <input className="input" value={editingStudent.phone} onChange={(e) => setEditingStudent({...editingStudent, phone: e.target.value})} required />
              </div>
              <div className="field">
                <label className="label">DOB</label>
                <input className="input" type="date" value={editingStudent.dob} onChange={(e) => setEditingStudent({...editingStudent, dob: e.target.value})} />
              </div>
              <div className="field">
                <label className="label">Batch</label>
                <select className="input" value={editingStudent.batch} onChange={(e) => setEditingStudent({...editingStudent, batch: e.target.value})}>
                  <option value="">Select</option>
                  {['2019-20','2020-21','2021-22','2022-23','2023-24','2024-25','2025-26','2026-27'].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">Standard</label>
                <input className="input" value={editingStudent.standard} onChange={(e) => setEditingStudent({...editingStudent, standard: e.target.value})} />
              </div>
              <div className="field">
                <label className="label">City</label>
                <input className="input" value={editingStudent.city} onChange={(e) => setEditingStudent({...editingStudent, city: e.target.value})} />
              </div>

              {/* Photo Upload Field */}
              <div className="field" style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                <label className="label">Profile Photo (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  className="input" 
                  style={{ paddingTop: '9px' }}
                  onChange={(e) => setEditPhotoFile(e.target.files[0])} 
                />
                {editingStudent.photoUrl && !editPhotoFile && (
                  <img src={editingStudent.photoUrl} alt="Current" className="current-photo-preview" />
                )}
                {editPhotoFile && (
                  <div style={{ fontSize: '12px', color: 'var(--green)', marginTop: '4px', fontWeight: 'bold' }}>
                    New photo selected. Will be uploaded on save.
                  </div>
                )}
              </div>

              <button className="primary-button submit-btn-full" type="submit" disabled={isUpdating}>
                {isUpdating ? 'Saving Updates...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* === Assign Modal Overlay === */}
      {isAssignModalOpen && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <div className="edit-modal-header">
              <h2>Assign {selectedStudents.length} Calls</h2>
              <button className="close-modal-btn" onClick={() => setIsAssignModalOpen(false)}>✕</button>
            </div>

            <form className="form-grid-compact" onSubmit={handleAssignCalls}>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label className="label">Task / Campaign Name</label>
                <input 
                  className="input" 
                  value={assignData.eventTitle} 
                  onChange={(e) => setAssignData({...assignData, eventTitle: e.target.value})} 
                  placeholder="e.g., Fees Reminder" 
                  required 
                />
              </div>
              <div className="field">
                <label className="label">Caller Name</label>
                <input 
                  className="input" 
                  value={assignData.callerName} 
                  onChange={(e) => setAssignData({...assignData, callerName: e.target.value})} 
                  placeholder="e.g., Aryan" 
                  required 
                />
              </div>
              <div className="field">
                <label className="label">Caller Email (Login ID)</label>
                <input 
                  className="input" 
                  type="email"
                  value={assignData.callerEmail} 
                  onChange={(e) => setAssignData({...assignData, callerEmail: e.target.value})} 
                  placeholder="aryan@gmail.com" 
                  required 
                />
              </div>

              <button className="primary-button submit-btn-full" type="submit" style={{ marginTop: '14px' }}>
                Assign to Caller
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;