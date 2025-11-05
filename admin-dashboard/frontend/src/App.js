import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Transcripts from './components/Transcripts';
import TranscriptDetail from './components/TranscriptDetail';
import Prompts from './components/Prompts';
import Greetings from './components/Greetings';
import { FiHome, FiFileText, FiMessageSquare, FiMic, FiLogOut } from 'react-icons/fi';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">
          <FiMic className="brand-icon" />
          <span>VoiceDesk AI Admin</span>
        </div>
        
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>

        <div className={`nav-links ${menuOpen ? 'active' : ''}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>
            <FiHome /> Dashboard
          </Link>
          <Link to="/transcripts" onClick={() => setMenuOpen(false)}>
            <FiFileText /> Transcripts
          </Link>
          <Link to="/prompts" onClick={() => setMenuOpen(false)}>
            <FiMessageSquare /> Prompts
          </Link>
          <Link to="/greetings" onClick={() => setMenuOpen(false)}>
            <FiMic /> Greetings
          </Link>
        </div>

        <div className="nav-user">
          <span>{user?.username}</span>
          <button onClick={logout} className="btn-logout">
            <FiLogOut /> Logout
          </button>
        </div>
      </nav>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" /> : <Login />} 
      />
      
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout><Dashboard /></Layout>
          </PrivateRoute>
        }
      />
      
      <Route
        path="/transcripts"
        element={
          <PrivateRoute>
            <Layout><Transcripts /></Layout>
          </PrivateRoute>
        }
      />
      
      <Route
        path="/transcripts/:callId"
        element={
          <PrivateRoute>
            <Layout><TranscriptDetail /></Layout>
          </PrivateRoute>
        }
      />
      
      <Route
        path="/prompts"
        element={
          <PrivateRoute>
            <Layout><Prompts /></Layout>
          </PrivateRoute>
        }
      />
      
      <Route
        path="/greetings"
        element={
          <PrivateRoute>
            <Layout><Greetings /></Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;

