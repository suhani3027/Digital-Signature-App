import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Login, Register, Dashboard, UploadDocument, DocumentList, SignDocument } from './pages';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  // Listen for changes to localStorage (e.g., login/logout in other tabs)
  useEffect(() => {
    const handleStorage = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Update auth state on login/logout in this tab
  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('token'));
  }, []);

  // Custom hook to get current location
  function usePath() {
    const location = useLocation();
    return location.pathname;
  }

  function AppRoutes() {
    const path = usePath();
    // Hide Navbar on login and register pages
    const hideNavbar = path === '/login' || path === '/register';
    return (
      <>
        {isAuthenticated && !hideNavbar && <Navbar />}
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/register" element={<Register setIsAuthenticated={setIsAuthenticated} />} />
          <Route
            path="/dashboard"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/upload"
            element={isAuthenticated ? <UploadDocument /> : <Navigate to="/login" />}
          />
          <Route
            path="/documents"
            element={isAuthenticated ? <DocumentList /> : <Navigate to="/login" />}
          />
          <Route
            path="/sign/:documentId"
            element={isAuthenticated ? <SignDocument /> : <Navigate to="/login" />}
          />
          {/* Add more routes as needed */}
        </Routes>
      </>
    );
  }

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
