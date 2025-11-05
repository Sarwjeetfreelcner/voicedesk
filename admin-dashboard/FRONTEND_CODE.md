# React Frontend Code - Complete Implementation

Copy each section below into the corresponding file in your `frontend/src/` directory.

## 📁 File Structure

```
frontend/src/
├── index.js
├── App.js
├── App.css
├── components/
│   ├── Login.js
│   ├── Dashboard.js
│   ├── Transcripts.js
│   ├── TranscriptDetail.js
│   ├── Prompts.js
│   └── Greetings.js
├── services/
│   └── api.js
└── context/
    └── AuthContext.js
```

---

## 📄 `public/index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="VoiceDesk AI Admin Dashboard" />
    <title>VoiceDesk AI - Admin Dashboard</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
```

---

## 📄 `src/index.js`

```javascript
import React from "react";
import ReactDOM from "react-dom/client";
import "./App.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## 📄 `src/services/api.js`

```javascript
import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  verify: () => api.get("/auth/verify"),
};

export const transcriptsAPI = {
  getAll: (page = 1, limit = 20) =>
    api.get(`/transcripts?page=${page}&limit=${limit}`),
  getOne: (callId) => api.get(`/transcripts/${callId}`),
  create: (data) => api.post("/transcripts", data),
  delete: (callId) => api.delete(`/transcripts/${callId}`),
};

export const promptsAPI = {
  getAll: () => api.get("/prompts"),
  getActive: () => api.get("/prompts/active"),
  create: (data) => api.post("/prompts", data),
  update: (id, data) => api.put(`/prompts/${id}`, data),
  delete: (id) => api.delete(`/prompts/${id}`),
};

export const greetingsAPI = {
  getAll: () => api.get("/greetings"),
  getActive: () => api.get("/greetings/active"),
  create: (data) => api.post("/greetings", data),
  update: (id, data) => api.put(`/greetings/${id}`, data),
  delete: (id) => api.delete(`/greetings/${id}`),
};

export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
};

export default api;
```

---

## 📄 `src/context/AuthContext.js`

```javascript
import React, { createContext, useState, useContext, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      try {
        await authAPI.verify();
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    const { token, user } = response.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);

    return user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 📄 `src/App.js`

```javascript
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Transcripts from "./components/Transcripts";
import TranscriptDetail from "./components/TranscriptDetail";
import Prompts from "./components/Prompts";
import Greetings from "./components/Greetings";
import {
  FiHome,
  FiFileText,
  FiMessageSquare,
  FiMic,
  FiLogOut,
} from "react-icons/fi";
import "./App.css";

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

        <div className={`nav-links ${menuOpen ? "active" : ""}`}>
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

      <main className="main-content">{children}</main>
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
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        }
      />

      <Route
        path="/transcripts"
        element={
          <PrivateRoute>
            <Layout>
              <Transcripts />
            </Layout>
          </PrivateRoute>
        }
      />

      <Route
        path="/transcripts/:callId"
        element={
          <PrivateRoute>
            <Layout>
              <TranscriptDetail />
            </Layout>
          </PrivateRoute>
        }
      />

      <Route
        path="/prompts"
        element={
          <PrivateRoute>
            <Layout>
              <Prompts />
            </Layout>
          </PrivateRoute>
        }
      />

      <Route
        path="/greetings"
        element={
          <PrivateRoute>
            <Layout>
              <Greetings />
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;
```

---

## Continued in next message...

The frontend code is extensive. I'll create individual component files next. Would you like me to:

1. Create all component files as separate files in the project?
2. Continue with the markdown documentation?
3. Create a single `INSTALL.sh` script that sets everything up automatically?

Let me know which approach you prefer, or I can do all three!
