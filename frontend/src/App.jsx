// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AddStock from "./pages/AddStock";
import SellStock from "./pages/SellStock";
import Audit from "./pages/Audit";
import ListStock from "./pages/ListStock";
import Alerts from "./pages/Alerts";  // ← New import

function ProtectedRoute({ children }) {
    const token = localStorage.getItem("access_token");
    return token ? children : <Navigate to="/login" replace />;
}

function AuthRoute({ children }) {
    const token = localStorage.getItem("access_token");
    return token ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
    return (
        <>
            <Navbar />

            <Routes>
                {/* Public routes */}
                <Route
                    path="/login"
                    element={
                        <AuthRoute>
                            <Login />
                        </AuthRoute>
                    }
                />

                <Route
                    path="/signup"
                    element={
                        <AuthRoute>
                            <Signup />
                        </AuthRoute>
                    }
                />

                {/* Protected routes */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/add-stock"
                    element={
                        <ProtectedRoute>
                            <AddStock />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/sell-stock"
                    element={
                        <ProtectedRoute>
                            <SellStock />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/audit"
                    element={
                        <ProtectedRoute>
                            <Audit />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/stock/list"
                    element={
                        <ProtectedRoute>
                            <ListStock />
                        </ProtectedRoute>
                    }
                />

                {/* New Alerts route */}
                <Route
                    path="/alerts"
                    element={
                        <ProtectedRoute>
                            <Alerts />
                        </ProtectedRoute>
                    }
                />

                {/* Catch-all */}
                <Route
                    path="*"
                    element={
                        localStorage.getItem("access_token") ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
            </Routes>
        </>
    );
}

export default App;