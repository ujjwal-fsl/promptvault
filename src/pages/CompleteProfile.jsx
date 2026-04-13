import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';

const styles = `
  .pv-cp-root {
    min-height: 100vh;
    background: #ffffff;
    display: flex;
    font-family: 'Inter', sans-serif;
    color: #0f0f0f;
    align-items: center;
    justify-content: center;
    padding: 24px;
    box-sizing: border-box;
  }
  .pv-cp-container {
    max-width: 400px;
    width: 100%;
    text-align: center;
  }
  .pv-cp-display {
    font-family: 'JetBrains Mono', monospace;
    font-size: 32px;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.03em;
    color: #0f0f0f;
    margin: 0 0 16px 0;
  }
  .pv-cp-subtext {
    font-size: 15px;
    line-height: 1.5;
    color: #6b7280;
    margin: 0 0 32px 0;
  }
  .pv-cp-input {
    width: 100%;
    padding: 12px 14px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    color: #0f0f0f;
    background: transparent;
    border: 1px solid #d1d5db;
    border-radius: 0;
    outline: none;
    transition: border-color 200ms ease;
    box-sizing: border-box;
    margin-bottom: 8px;
  }
  .pv-cp-input:focus {
    border-color: #374151;
  }
  .pv-cp-input.error {
    border-color: #dc2626;
  }
  .pv-cp-error-msg {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #dc2626;
    margin-top: 4px;
    margin-bottom: 16px;
    letter-spacing: 0.04em;
    text-align: left;
  }
  .pv-cp-btn {
    width: 100%;
    padding: 13px 24px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #ffffff;
    background: #0f0f0f;
    border: 1px solid #0f0f0f;
    border-radius: 0;
    cursor: pointer;
    transition: opacity 200ms ease;
    margin-top: 16px;
  }
  .pv-cp-btn:hover:not(:disabled) {
    opacity: 0.9;
  }
  .pv-cp-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function CompleteProfile() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); // default true to fetch first
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const id = 'pv-cp-styles';
    if (!document.getElementById(id)) {
      const el = document.createElement('style');
      el.id = id;
      el.textContent = styles;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!active) return;
        
        if (!user) {
          // not logged in
          navigate('/auth');
          return;
        }

        if (user.username) {
          // already has username
          navigate('/');
        } else {
          setCurrentUser(user);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (active) setLoading(false);
      }
    };
    fetchProfile();
    return () => { active = false; };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = username.trim().toLowerCase();
    
    const regex = /^[a-z0-9_]{3,20}$/;
    if (!regex.test(val)) {
      setError('Username must be 3-20 characters long, containing only letters, numbers, and underscores.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await authService.updateUsername(currentUser.id, val);
      // Success. Redirect using window.location so AuthContext rechecks and doesn't redirect back here.
      window.location.href = '/admin'; // Redirecting to admin, typical entry logic after login
    } catch (err) {
      console.error(err);
      if (err.message === 'Username already taken') {
        setError(err.message);
      } else {
        setError('Failed to save username. Try again.');
      }
      setLoading(false);
    }
  };

  if (loading && !currentUser) {
    // We could return a simple loader or null, wait for the redirect/auth
    return (
      <div className="pv-cp-root">
         <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pv-cp-root">
      <div className="pv-cp-container">
        <h1 className="pv-cp-display">Complete Profile</h1>
        <p className="pv-cp-subtext">Choose a username to continue.</p>
        
        <form onSubmit={handleSubmit} noValidate>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError('');
            }}
            className={`pv-cp-input ${error ? 'error' : ''}`}
            disabled={loading}
            autoFocus
          />
          {error && <div className="pv-cp-error-msg">{error}</div>}

          <button type="submit" disabled={loading} className="pv-cp-btn">
            {loading ? 'SAVING...' : 'CONTINUE'}
          </button>
        </form>
      </div>
    </div>
  );
}
