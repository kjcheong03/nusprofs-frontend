import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar  from './Navbar';
import Home    from './pages/Home';
import About   from './pages/About';
import Pricing from './pages/Pricing';
import Profile from './pages/Profile';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"              element={<Home />}    />
        <Route path="/about"         element={<About />}   />
        <Route path="/pricing"       element={<Pricing />} />
        <Route path="/professor/:id" element={<Profile />} />
      </Routes>
    </>
  );
}
