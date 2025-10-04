import { useState } from 'react'

import { BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom";

import './App.css'
import MainLayout from './Layouts/MainLayout';
import Home from './Pages/Home';
import Signup from './Pages/Signup';
import Login from './Pages/Login';
import MedicineForm from './Pages/MedicineForm';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CircusLandingPage from './Components/landing/CircusLandingPage.jsx';
import './App.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <MainLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/Signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/medicine-form" element={<MedicineForm />} />
            {/* Add more routes as needed */}
          </Routes>
        </MainLayout>
  )
    <Router>
      <Routes>
        <Route path="/" element={<CircusLandingPage />} />
        {/* Add more routes here as you build */}
        <Route path="/dashboard" element={<div>Dashboard Coming Soon</div>} />
        <Route path="/login" element={<div>Login Page Coming Soon</div>} />
        <Route path="/signup" element={<div>Signup Page Coming Soon</div>} />
      </Routes>
    </Router>
  );
}

export default App;