import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/auth';

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirm_password: ''
  });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerUser(form);
      nav('/login');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const card = {
    maxWidth: '400px', margin: '0 auto', padding: '2rem',
    background:'#fff', borderRadius:'8px', boxShadow:'0 2px 8px rgba(0,0,0,0.1)'
  };
  const input = {
    width:'100%', padding:'0.5rem', marginTop:'0.25rem',
    border:'1px solid #ccc', borderRadius:'4px', fontSize:'1rem'
  };
  const label = { display:'block', marginBottom:'1rem' };
  const button = {
    width:'100%', padding:'0.75rem', marginTop:'1rem',
    border:'none', borderRadius:'4px', background:'#0070f3',
    color:'#fff', fontSize:'1rem', opacity:loading?0.6:1,
    cursor: loading?'not-allowed':'pointer'
  };
  const errStyle = { color:'#b00', textAlign:'center', margin:'0.5rem 0' };

  return (
    <div style={{ minHeight: '100vh', background: '#f0fcff', padding: '2rem' }}>
      <div style={card}>
        <h2 style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          Register an Account
        </h2>
        <form onSubmit={handleSubmit}>
          {['username','email','password','confirm_password'].map(field => (
            <label key={field} style={label}>
              {field.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
              <input
                name={field}
                type={field.includes('password')?'password':'text'}
                value={form[field]}
                onChange={onChange}
                style={input}
                required
              />
            </label>
          ))}
          {error && <div style={errStyle}>{error}</div>}
          <button style={button} disabled={loading}>
            {loading ? 'Registering…' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}
