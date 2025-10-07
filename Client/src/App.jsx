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
import EditMedicine from './Pages/EditMedicines.jsx';
import DoseTrackerPage from './Pages/DoseTrackerPage.jsx';
import { useEffect } from 'react';
import { useDispatch,useSelector } from 'react-redux';
import { getCurrentUser } from './Hooks/getCurrentUser.js';
import About from './Pages/About.jsx';

function App() {
  const dispatch = useDispatch();
  const authStatus = useSelector(state => state.auth.status);
  const userData = useSelector(state => state.auth.userData);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  console.log("Auth Status:", authStatus);
  useEffect(() => {
    getCurrentUser(dispatch)
    .finally(() => setLoading(false));
  },[authStatus,dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-500 border-solid mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }


  return (
    <>
      <Curtain />
      <Routes>
        {/* Public / Landing / Auth routes (no MainLayout chrome) */}
        <Route path="/" element={<Navigate to="/circus" replace />} />
        <Route path="/circus" element={<CircusLandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/about" element={<About />} />

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
          path="/dose-tracker"
          element={
            <MainLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
              <DoseTrackerPage />
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
         <Route path="/edit-medicine/:id" element={<EditMedicine />} />
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