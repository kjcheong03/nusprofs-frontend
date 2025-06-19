import React, { useEffect } from 'react'
import { Routes, Route }     from 'react-router-dom'

import AuthProvider        from './context/AuthContext'
import Navbar              from './Navbar'
import Home                from './pages/Home'
import About               from './pages/About'
import Pricing             from './pages/Pricing'
import Profile             from './pages/Profile'
import UserProfile         from './pages/UserProfile'
import OtherUserProfile    from './pages/OtherUserProfile' 
import Login               from './pages/Login'
import Register            from './pages/Register'

export default function App() {
  useEffect(() => { fetch('https://nusprofs-api.onrender.com/') }, [])

  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/"                element={<Home />} />
        <Route path="/about"           element={<About />} />
        <Route path="/pricing"         element={<Pricing />} />
        <Route path="/professor/:id"   element={<Profile />} />
        <Route path="/profile"         element={<UserProfile />} />
        <Route path="/users/:username" element={<OtherUserProfile />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
      </Routes>
    </AuthProvider>
  )
}
