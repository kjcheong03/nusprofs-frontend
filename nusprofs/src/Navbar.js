// src/Navbar.js
import React from 'react';
import { Link, useMatch, useResolvedPath } from 'react-router-dom';
import { logoutUser } from './services/auth';

export default function Navbar() {
  const token = localStorage.getItem('access_token');

  return (
    <nav className="nav">
      <Link to="/" className="site-title">NUSProfs</Link>
      <ul>
        <CustomLink to="/pricing">Placeholder 1</CustomLink>
        <CustomLink to="/about">Placeholder 2</CustomLink>

        {token ? (
          <li>
            <button
              onClick={() => {
                logoutUser();
                window.location = '/'; // refresh to clear state
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                padding: '.25rem',
              }}
            >
              Logout
            </button>
          </li>
        ) : (
          <>
            <CustomLink to="/login">Login</CustomLink>
            <CustomLink to="/register">Register</CustomLink>
          </>
        )}
      </ul>
    </nav>
  );
}

function CustomLink({ to, children, ...props }) {
  const resolved = useResolvedPath(to);
  const active   = useMatch({ path: resolved.pathname, end: true });
  return (
    <li className={active ? 'active' : ''}>
      <Link to={to} {...props}>{children}</Link>
    </li>
  );
}
