import React, { useState, useContext } from 'react';
import { useNavigate }              from 'react-router-dom';
import { loginUser }                from '../services/auth';
import { AuthContext }              from '../context/AuthContext';

export default function Login() {
  const nav = useNavigate();
  const { refreshUser } = useContext(AuthContext);

  const [user, setUser]       = useState('');
  const [pass, setPass]       = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginUser(user, pass);
      await refreshUser();      
      nav('/');                 
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const card = {
    maxWidth: '400px', margin: '0 auto', padding: '2rem',
    background: '#fff', borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  };
  const input = {
    width: '100%', padding: '0.5rem', marginTop: '0.25rem',
    border: '1px solid #ccc', borderRadius: '4px', fontSize: '1rem'
  };
  const label = { display: 'block', marginBottom: '1rem' };
  const button = {
    width: '100%', padding: '0.75rem', marginTop: '1rem',
    border: 'none', borderRadius: '4px', background: '#0070f3',
    color: '#fff', fontSize: '1rem',
    opacity: loading ? 0.6 : 1,
    cursor: loading ? 'not-allowed' : 'pointer'
  };
  const errStyle = { color: '#b00', textAlign: 'center', margin: '0.5rem 0' };

  return (
    <div style={{ minHeight: '100vh', background: '#f0fcff', padding: '2rem' }}>
      <div style={card}>
        <h2 style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          Login to NUSProfs
        </h2>
        <form onSubmit={handleSubmit}>
          <label style={label}>
            Username
            <input
              style={input}
              value={user}
              onChange={e => setUser(e.target.value)}
              required autoFocus
            />
          </label>
          <label style={label}>
            Password
            <input
              style={input}
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              required
            />
          </label>
          {error && <div style={errStyle}>{error}</div>}
          <button style={button} disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
