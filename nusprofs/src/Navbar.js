import React, { useContext } from 'react';
import { Link, useMatch, useResolvedPath, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

export default function Navbar() {
  const { isLoggedIn, user, logout, loading } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const navStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '60px',
    padding: '0 2rem',
    backgroundColor: '#f0fcff',
  };
  const leftGroup = {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
  };
  const linkList = {
    display: 'flex',
    gap: '2rem',
    listStyle: 'none',
    margin: 0,
    padding: 0,
  };
  const authLink = {
    fontSize: '1rem',
    lineHeight: '1',
    textDecoration: 'none',
    color: '#0077cc',
    fontWeight: 600,
  };
  const profileLink = { ...authLink };
  const logoutBtn = {
    fontSize: '1rem',
    lineHeight: '1',
    padding: '0.25rem 0.75rem',
    border: '1px solid #0077cc',
    borderRadius: '4px',
    background: 'none',
    cursor: 'pointer',
    color: '#0077cc',
  };

  const handleLogout = () => {
    logout();
    const isUserProfile = location.pathname === "/profile";
    const isOtherUserProfile = /^\/user\/[^/]+$/.test(location.pathname);
    if (isUserProfile || isOtherUserProfile) {
      navigate("/");
    }
  };

  return (
    <nav style={navStyle}>
      <div style={leftGroup}>
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

        <ul style={linkList}>
          <CustomLink to="/">Search</CustomLink>
          <CustomLink to="/top-professors">Top Professors</CustomLink>
          <CustomLink to="/compare-professors">Compare Professors</CustomLink>
        </ul>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {!loading &&
          (isLoggedIn ? (
            <>
              <Link to="/profile" style={profileLink}>
                Welcome, {user.username}
              </Link>
              <button onClick={handleLogout} style={logoutBtn}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={authLink}>
                Login
              </Link>
              <Link to="/register" style={authLink}>
                Register
              </Link>
            </>
          ))}
      </div>
    </nav>
  );
}

function CustomLink({ to, children, ...props }) {
  const resolved = useResolvedPath(to);
  const active = useMatch({ path: resolved.pathname, end: true });

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
          fontWeight: active ? 600 : 400,
        }}
      >
        {children}
      </Link>
    </li>
  );
}
