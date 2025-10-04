import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
    <Router>
      <MainLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/circus" element={<CircusLandingPage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/medicine-form" element={<MedicineForm />} />
          {/* Add more routes as needed */}
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;