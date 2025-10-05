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
import MyMedicines from './Pages/MyMedicines.jsx';
import Dashboard from './Pages/Dashboard.jsx';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Curtain />
      <Routes>
        {/* Public / Landing / Auth routes (no MainLayout chrome) */}
        <Route path="/" element={<Navigate to="/circus" replace />} />
        <Route path="/circus" element={<CircusLandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* App routes wrapped with MainLayout so Navbar/Sidebar/Footer appear */}
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

        <Route
          path="/myMedicines"
          element={
            <MainLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
              <MyMedicines />
            </MainLayout>
          }
        />

        <Route
          path="/dashboard"
          element={
            <MainLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
              <Dashboard />
            </MainLayout>
          }
        />

        {/* Fallback: render home inside MainLayout for any unmatched /app paths */}
        <Route
          path="/app/*"
          element={
            <MainLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
              <Home />
            </MainLayout>
          }
        />
      </Routes>
    </>
  );
}

export default App;