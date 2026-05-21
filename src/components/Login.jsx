import React, { useState } from 'react';
// NAYA IMPORT: sendPasswordResetEmail ko add kiya gaya hai
import { auth } from '../firebase'; 
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

const Login = ({ setAuth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // NAYE STATES: Forgot Password UI aur Messages manage karne ke liye
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResetMessage('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem('isLoggedIn', 'true');
      setAuth(true);
    } catch (err) {
      console.error("Login Error:", err.message);
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // NAYA FUNCTION: Password Reset Link bhejne ke liye
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Bhai, pehle apna Email address toh enter karo!');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setResetMessage('');

    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage('Password reset link aapke email par bhej diya gaya hai. Apna inbox check karein!');
    } catch (err) {
      console.error("Reset Error:", err.message);
      setError('Error: Email address verify nahi ho paya ya exist nahi karta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #f5f7fb;
        }

        .login-shell {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 28px;
          color: #101828;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.22), transparent 34%),
            radial-gradient(circle at top right, rgba(219, 39, 119, 0.18), transparent 30%),
            linear-gradient(135deg, #f8fafc 0%, #eef4ff 48%, #fff5f8 100%);
          overflow: hidden;
          position: relative;
        }

        .login-shell:before {
          content: "";
          position: absolute;
          width: 520px;
          height: 520px;
          border-radius: 999px;
          right: -220px;
          top: -220px;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.22), rgba(219, 39, 119, 0.16));
        }

        .login-shell:after {
          content: "";
          position: absolute;
          width: 360px;
          height: 360px;
          border-radius: 999px;
          left: -170px;
          bottom: -170px;
          background: rgba(15, 23, 42, 0.08);
        }

        .login-wrap {
          width: min(1040px, 100%);
          min-height: 620px;
          display: grid;
          grid-template-columns: 1.08fr 0.92fr;
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid rgba(232, 237, 245, 0.92);
          border-radius: 34px;
          box-shadow: 0 30px 80px rgba(16, 24, 40, 0.16);
          overflow: hidden;
          position: relative;
          z-index: 1;
          backdrop-filter: blur(18px);
        }

        .brand-panel {
          padding: 44px;
          color: white;
          background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(29, 78, 216, 0.92), rgba(219, 39, 119, 0.86));
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .brand-panel:after {
          content: "";
          position: absolute;
          width: 260px;
          height: 260px;
          border-radius: 999px;
          right: -90px;
          top: -80px;
          background: rgba(255, 255, 255, 0.11);
        }

        .brand-content {
          position: relative;
          z-index: 1;
        }

        .brand-mark {
          width: 58px;
          height: 58px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.18);
          display: grid;
          place-items: center;
          font-size: 23px;
          font-weight: 950;
          margin-bottom: 28px;
        }

        .eyebrow {
          color: rgba(255, 255, 255, 0.72);
          font-size: 12px;
          font-weight: 850;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .brand-title {
          margin: 0;
          max-width: 480px;
          font-size: clamp(34px, 5vw, 58px);
          line-height: 1.02;
          letter-spacing: 0;
          font-weight: 950;
        }

        .brand-copy {
          max-width: 430px;
          margin: 18px 0 0;
          color: rgba(255, 255, 255, 0.78);
          font-size: 15px;
          line-height: 1.7;
          font-weight: 600;
        }

        .brand-stats {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 34px;
        }

        .brand-stat {
          padding: 14px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.14);
        }

        .brand-stat strong {
          display: block;
          font-size: 20px;
          line-height: 1;
          font-weight: 950;
        }

        .brand-stat span {
          display: block;
          margin-top: 7px;
          color: rgba(255, 255, 255, 0.70);
          font-size: 11px;
          font-weight: 800;
        }

        .login-panel {
          padding: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.92);
        }

        .login-card {
          width: 100%;
          max-width: 390px;
        }

        .login-icon {
          width: 54px;
          height: 54px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: #eff6ff;
          color: #2563eb;
          margin-bottom: 22px;
        }

        .login-title {
          margin: 0;
          color: #101828;
          font-size: 30px;
          font-weight: 950;
          letter-spacing: 0;
        }

        .login-subtitle {
          margin: 9px 0 28px;
          color: #667085;
          font-size: 14px;
          font-weight: 650;
          line-height: 1.5;
        }

        .error-box {
          margin-bottom: 18px;
          border: 1px solid #fecdca;
          background: #fff1f3;
          color: #b42318;
          border-radius: 16px;
          padding: 13px 14px;
          font-size: 13px;
          font-weight: 850;
        }

        .success-box {
          margin-bottom: 18px;
          border: 1px solid #a6f4c5;
          background: #ecfdf3;
          color: #027a48;
          border-radius: 16px;
          padding: 13px 14px;
          font-size: 13px;
          font-weight: 850;
        }

        .form {
          display: grid;
          gap: 16px;
        }

        .field {
          display: grid;
          gap: 8px;
        }

        .label {
          color: #344054;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .input-wrap {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #98a2b3;
          pointer-events: none;
        }

        .input {
          width: 100%;
          height: 52px;
          border: 1px solid #d9e0ea;
          background: #f9fafb;
          border-radius: 16px;
          padding: 0 14px 0 42px;
          color: #101828;
          font-size: 15px;
          font-weight: 750;
          outline: none;
          transition: 170ms ease;
        }

        .input::placeholder {
          color: #98a2b3;
          font-weight: 650;
        }

        .input:focus {
          background: white;
          border-color: #2563eb;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.10);
        }

        .login-button {
          height: 54px;
          border: 0;
          cursor: pointer;
          border-radius: 17px;
          margin-top: 4px;
          background: linear-gradient(135deg, #2563eb, #db2777);
          color: white;
          font-size: 14px;
          font-weight: 950;
          box-shadow: 0 16px 30px rgba(37, 99, 235, 0.24);
          transition: 170ms ease;
        }

        .login-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 20px 38px rgba(37, 99, 235, 0.30);
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          box-shadow: none;
        }

        .text-btn {
          background: none;
          border: none;
          color: #2563eb;
          font-size: 13px;
          font-weight: 850;
          cursor: pointer;
          padding: 0;
          text-align: right;
          margin-top: 4px;
        }
        
        .text-btn:hover {
          text-decoration: underline;
        }

        .login-footer {
          margin-top: 24px;
          color: #98a2b3;
          font-size: 12px;
          font-weight: 700;
          text-align: center;
        }

        @media (max-width: 860px) {
          .login-wrap {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .brand-panel {
            padding: 34px;
          }

          .brand-stats {
            grid-template-columns: 1fr 1fr 1fr;
          }

          .login-panel {
            padding: 34px;
          }
        }

        @media (max-width: 520px) {
          .login-shell {
            padding: 16px;
          }

          .login-wrap {
            border-radius: 26px;
          }

          .brand-panel,
          .login-panel {
            padding: 24px;
          }

          .brand-stats {
            grid-template-columns: 1fr;
          }

          .brand-title {
            font-size: 34px;
          }
        }
      `}</style>

      <div className="login-wrap">
        <section className="brand-panel">
          <div className="brand-content">
            <div className="brand-mark">K</div>
            <div className="eyebrow">Krins CRM Portal</div>
            <h1 className="brand-title">A cleaner way to manage daily calls.</h1>
            <p className="brand-copy">
              Secure admin access for student records, follow-up tasks, call feedback, and live Firebase synced history.
            </p>
          </div>

          <div className="brand-stats">
            <div className="brand-stat">
              <strong>Live</strong>
              <span>Firebase sync</span>
            </div>
            <div className="brand-stat">
              <strong>CRM</strong>
              <span>Call workflow</span>
            </div>
            <div className="brand-stat">
              <strong>Admin</strong>
              <span>Secure portal</span>
            </div>
          </div>
        </section>

        <section className="login-panel">
          <div className="login-card">
            <div className="login-icon">
              {isResetMode ? (
                <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  <path d="M19 16v6" />
                  <path d="M16 19h6" />
                </svg>
              ) : (
                <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              )}
            </div>

            <h2 className="login-title">{isResetMode ? 'Reset Password' : 'Welcome back'}</h2>
            <p className="login-subtitle">
              {isResetMode 
                ? 'Apna registered admin email dalein. Hum aapko ek secure password reset link bhejenge.' 
                : 'Enter your secure credentials to access the CRM dashboard.'}
            </p>

            {error && <div className="error-box">{error}</div>}
            {resetMessage && <div className="success-box">{resetMessage}</div>}

            <form className="form" onSubmit={isResetMode ? handlePasswordReset : handleLogin}>
              <div className="field">
                <label className="label">Email Address</label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </span>
                  <input
                    className="input"
                    type="email"
                    placeholder="admin@krins.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                      setResetMessage('');
                    }}
                    required
                  />
                </div>
              </div>

              {!isResetMode && (
                <div className="field">
                  <label className="label">Password</label>
                  <div className="input-wrap">
                    <span className="input-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="11" x="3" y="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      className="input"
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      type="button" 
                      className="text-btn" 
                      onClick={() => {
                        setIsResetMode(true);
                        setError('');
                        setResetMessage('');
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
              )}

              <button className="login-button" type="submit" disabled={isLoading}>
                {isLoading 
                  ? 'Processing...' 
                  : (isResetMode ? 'Send Reset Link' : 'Access Dashboard')
                }
              </button>

              {isResetMode && (
                <button 
                  type="button" 
                  className="text-btn" 
                  style={{ textAlign: 'center', marginTop: '10px' }}
                  onClick={() => {
                    setIsResetMode(false);
                    setError('');
                    setResetMessage('');
                  }}
                >
                  Back to Login
                </button>
              )}
            </form>

            <div className="login-footer">2026 Krins IT Solutions. All rights reserved.</div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;