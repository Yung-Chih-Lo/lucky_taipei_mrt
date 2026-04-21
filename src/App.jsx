import React from 'react'
import { Routes, Route } from 'react-router-dom'
import MainPage from './pages/MainPage.jsx'
import AdminPage from './pages/AdminPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}

export default App
