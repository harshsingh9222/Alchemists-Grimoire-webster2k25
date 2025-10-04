import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom";

import './App.css'
import MainLayout from './Layouts/MainLayout';
import Home from './Pages/Home';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <MainLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Add more routes as needed */}
          </Routes>
        </MainLayout>
  )
}

export default App
