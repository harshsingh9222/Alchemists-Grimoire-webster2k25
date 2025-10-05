import { useState } from 'react'
import { Routes, Route, Navigate } from "react-router-dom";
import './App.css'
import MainLayout from './Layouts/MainLayout';
import Home from './Pages/Home';
import Signup from './Pages/Signup';
import Login from './Pages/Login';
import MedicineForm from './Pages/MedicineForm';
import CircusLandingPage from './Components/landing/CircusLandingPage.jsx';
import Curtain from './Components/Curtain';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <>
      <Curtain />
      <Routes>
      {/* Landing and auth pages render without MainLayout */}
      <Route path="/" element={<CircusLandingPage />} />
      <Route path="/circus" element={<CircusLandingPage />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />

      {/* Routes wrapped with MainLayout (show navbar/sidebar) */}
      <Route
        path="/home"
        element={
          <MainLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
            <Home />
          </MainLayout>
        }
      />

      <Route
        path="/medicine-form"
        element={
          <MainLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
            <MedicineForm />
          </MainLayout>
        }
      />

      {/* Fallback: redirect unknown routes to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}

export default App;