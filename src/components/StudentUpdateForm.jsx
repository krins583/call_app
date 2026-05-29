import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import './Dashboard.css'; // For common inputs/buttons
import './StudentUpdateForm.css'; // NAYI CSS FILE

const StudentUpdateForm = () => {
  const [studentId, setStudentId] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', dob: '', batch: '', standard: '', city: '', photoUrl: '' });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState('');

  // 1. URL se ID nikal kar data fetch karna
  useEffect(() => {
    const fetchStudentData = async () => {
      
      // === NAYA LOGIC: HashRouter se ID nikalne ka Smart Tareeka ===
      let id = null;
      
      // Pehle normal URL me check karein
      const queryParams = new URLSearchParams(window.location.search);
      id = queryParams.get('id');
      
      // Agar normal me nahi mila, toh Hash (#) ke andar check karein
      if (!id && window.location.hash.includes('?')) {
        const hashString = window.location.hash.split('?')[1];
        const hashParams = new URLSearchParams(hashString);
        id = hashParams.get('id');
      }
      // =========================================================

      if (!id) {
        setError("Invalid Link! URL mein ID nahi hai.");
        setLoading(false);
        return;
      }
      
      setStudentId(id);

      try {
        const docRef = doc(db, 'students', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setFormData(docSnap.data());
        } else {
          setError("Student nahi mila. Link purana ho sakta hai.");
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  const uploadPhotoToImgBB = async (file) => {
    const form = new FormData();
    form.append('image', file);
    
    // NAYA: Apni ImgBB API Key yahan rakhein
    const IMGBB_API_KEY = '13e4995f1801e490813d35e0720f78d3'; 
    
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (data.success) {
        return data.data.url;
      }
      return null;
    } catch (err) {
      console.error('ImgBB Upload Error:', err);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      let finalPhotoUrl = formData.photoUrl || '';
      
      if (photoFile) {
        const uploadedUrl = await uploadPhotoToImgBB(photoFile);
        if (uploadedUrl) {
          finalPhotoUrl = uploadedUrl;
        } else {
          alert("Photo upload me problem aayi, par baaki details save ho jayengi.");
        }
      }

      const docRef = doc(db, 'students', studentId);
      await updateDoc(docRef, {
        name: formData.name,
        phone: formData.phone,
        dob: formData.dob,
        batch: formData.batch,
        standard: formData.standard,
        city: formData.city,
        photoUrl: finalPhotoUrl
      });

      setSuccess(true);
    } catch (err) {
      alert("Update fail ho gaya: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="status-container">
        <div className="status-card">
          <h2 style={{ color: '#101828' }}>Loading profile...</h2>
          <p style={{ color: '#667085' }}>Please wait a moment.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-container">
        <div className="status-card" style={{ borderColor: '#FEE4E2' }}>
          <h2 style={{ color: '#D92D20' }}>{error}</h2>
          <p style={{ color: '#667085' }}>Please ask the admin for a new link.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="status-container">
        <div className="status-card">
          <div className="success-icon">🎉</div>
          <h2 style={{ color: '#101828', marginBottom: '10px' }}>Profile Updated!</h2>
          <p style={{ color: '#667085' }}>Aapki profile aur photo successfully update ho gayi hai. Ab aap is tab ko close kar sakte hain.</p>
        </div>
      </div>
    );
  }

  // Current image logic
  const displayImage = photoFile 
    ? URL.createObjectURL(photoFile) 
    : (formData.photoUrl || null);

  return (
    <div className="update-form-wrapper">
      <div className="update-form-card">
        <h2 className="update-form-title">Update Profile</h2>
        <p className="update-form-subtitle">Kripya apni current details verify aur update karein.</p>
        
        <form onSubmit={handleSubmit} className="update-form-grid">
          
          <div className="photo-upload-section">
            <div className="photo-preview-circle">
              {displayImage ? (
                <img src={displayImage} alt="Profile" className="photo-preview-image" />
              ) : (
                <span className="no-photo-text">No Photo</span>
              )}
            </div>
            
            <label className="change-photo-btn">
              {displayImage ? 'Change Photo' : 'Upload Photo'}
              <input 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={(e) => setPhotoFile(e.target.files[0])} 
              />
            </label>
          </div>

          <div className="field">
            <label className="label">Full Name</label>
            <input className="input" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          
          <div className="field">
            <label className="label">Phone Number</label>
            <input className="input" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
          </div>

          <div className="field">
            <label className="label">Date of Birth</label>
            <input className="input" type="date" value={formData.dob || ''} onChange={(e) => setFormData({...formData, dob: e.target.value})} />
          </div>

          <div className="field">
            <label className="label">Standard</label>
            <input className="input" value={formData.standard || ''} onChange={(e) => setFormData({...formData, standard: e.target.value})} />
          </div>

          <div className="field">
            <label className="label">City</label>
            <input className="input" value={formData.city || ''} onChange={(e) => setFormData({...formData, city: e.target.value})} />
          </div>

          <button className="primary-button save-profile-btn" type="submit" disabled={updating}>
            {updating ? 'Saving Profile...' : 'Save My Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentUpdateForm;