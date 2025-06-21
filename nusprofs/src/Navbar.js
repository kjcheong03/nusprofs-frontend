import React, { useContext } from 'react';
import { Link, useMatch, useResolvedPath } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

export default function Navbar() {
  const { isLoggedIn, user, logout, loading } = useContext(AuthContext);

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '60px',
        padding: '0 2rem',
        backgroundColor: '#f0fcff',
      }}
    >
      <Link
        to="/"
        className="site-title"
        style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          textDecoration: 'none',
          color: 'black',
        }}
      >
        NUSProfs
      </Link>

      <ul
        style={{
          display: 'flex',
          gap: '2rem',
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        <CustomLink to="/pricing">Placeholder 1</CustomLink>
        <CustomLink to="/about">Placeholder 2</CustomLink>
      </ul>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        {!loading && (isLoggedIn ? (
          <>
            <Link
              to="/profile"
              style={{
                fontSize: '1rem',
                lineHeight: '1',
                textDecoration: 'none',
                color: '#0077cc',
                fontWeight: '600',
              }}
            >
              Welcome, {user.username}
            </Link>
            <button
              onClick={logout}
              style={{
                fontSize: '1rem',
                lineHeight: '1',
                padding: '0.25rem 0.75rem',
                border: '1px solid #0077cc',
                borderRadius: '4px',
                background: 'none',
                cursor: 'pointer',
                color: '#0077cc',
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <CustomLink to="/login">Login</CustomLink>
            <CustomLink to="/register">Register</CustomLink>
          </>
        ))}
      </div>
    </nav>
  );
}

function CustomLink({ to, children, ...props }) {
  const resolved = useResolvedPath(to);
  const active   = useMatch({ path: resolved.pathname, end: true });
  return (
    <li style={{ margin: 0 }}>
      <Link
        to={to}
        {...props}
        style={{
          textDecoration: 'none',
          fontSize: '1rem',
          lineHeight: '1',
          color: active ? '#0077cc' : 'black',
          fontWeight: active ? '600' : '400',
        }}
      >
        {children}
      </Link>
    </li>
  );
}
