import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CircusLandingPage from './Components/landing/CircusLandingPage.jsx';
import './App.css';

function App() {
  return (
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