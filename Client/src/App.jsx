import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import './App.css'
import MainLayout from './Layouts/MainLayout';
import Home from './Pages/Home';
import Signup from './Pages/Signup';
import Login from './Pages/Login';
import MedicineForm from './Pages/MedicineForm';
import CircusLandingPage from './Components/landing/CircusLandingPage.jsx';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
      <MainLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
        <Routes>
          <Route path="/" element={<Navigate to="/circus" replace />} />
          <Route path="/circus" element={<CircusLandingPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/medicine-form" element={<MedicineForm />} />
          {/* Add more routes as needed */}
        </Routes>
      </MainLayout>
  );
}

export default App;