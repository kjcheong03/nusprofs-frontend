import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_URL = 'https://nusprofs-api.onrender.com';

export default function Profile() {
  const { id } = useParams();
  const [prof, setProf]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/professor/${id}/`, {
      headers: { Accept: 'application/json' }
    })
      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then(data => setProf(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p style={{ textAlign: 'center' }}>Loading…</p>;
  if (error)   return <p style={{ color: 'red', textAlign: 'center' }}>Error: {error}</p>;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f0fcff',
        padding: '2rem',
        fontFamily: 'Arial, sans-serif',
        textAlign: 'left'
      }}
    >
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <Link to="/" style={{ color: '#0077cc', textDecoration: 'none' }}>
          ← Back to search
        </Link>

        <h1 style={{ marginTop: '1rem', marginBottom: '1rem' }}>{prof.name}</h1>

        {prof.title &&      <p><strong>Title:</strong> {prof.title}</p>}
        {prof.faculty &&    <p><strong>Faculty:</strong> {prof.faculty}</p>}
        {prof.department && <p><strong>Department:</strong> {prof.department}</p>}
        {prof.office &&     <p><strong>Office:</strong> {prof.office}</p>}
        {prof.phone &&      <p><strong>Phone:</strong> {prof.phone}</p>}
        {prof.average_rating != null && (
          <p><strong>Rating:</strong> {prof.average_rating}</p>
        )}

        {prof.teaching && prof.teaching.length > 0 && (
          <>
            <h2 style={{ marginTop: '2rem' }}>Teaching History</h2>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              {prof.teaching.map((t, i) => (
                <li key={i}>
                  {t.module_code} – {t.module_name} ({t.semester})
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
