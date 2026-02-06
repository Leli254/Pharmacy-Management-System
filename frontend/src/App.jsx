import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UserManagement from "./pages/UserManagement";
import Dashboard from "./pages/Dashboard";
import AddStock from "./pages/AddStock";
import SellStock from "./pages/SellStock";
import Audit from "./pages/Audit";
import ListStock from "./pages/ListStock";
import Alerts from "./pages/Alerts";
import AddGeneric from "./pages/AddGeneric";
import AddBrand from "./pages/AddBrand";
import DispensaryChecklist from "./pages/DispensaryChecklist";
import PurchasesReport from "./pages/PurchasesReport";
import DDARegister from "./pages/DDARegister";
import PrescriptionBook from "./pages/PrescriptionBook";
import GenericsList from "./pages/GenericsList";
import GenericEdit from "./pages/GenericEdit";
import BrandsList from "./pages/BrandsList";
import EditBrand from "./pages/EditBrand";
import SuppliersList from "./pages/SuppliersList";
import EditSupplier from "./pages/EditSupplier";
import AddSupplier from "./pages/AddSupplier";
import SalesReports from "./pages/SalesReports";
import AdminSettings from "./pages/AdminSettings"; // Import the Admin Settings page

// Protected Route Guard
function ProtectedRoute({ children }) {
    const token = localStorage.getItem("access_token");
    return token ? children : <Navigate to="/login" replace />;
}

// Admin-only Route Guard
function AdminRoute({ children }) {
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");

    if (!token) return <Navigate to="/login" replace />;
    if (role !== "admin") return <Navigate to="/dashboard" replace />;

    return children;
}

function AuthRoute({ children }) {
    const token = localStorage.getItem("access_token");
    return token ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
    return (
        /* The flex wrapper ensures the footer stays at the bottom */
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />

            <div style={{ flex: 1, paddingBottom: '40px' }}>
                <Routes>
                    <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
                    <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />

                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/add-stock" element={<ProtectedRoute><AddStock /></ProtectedRoute>} />
                    <Route path="/sell-stock" element={<ProtectedRoute><SellStock /></ProtectedRoute>} />
                    <Route path="/audit" element={<ProtectedRoute><Audit /></ProtectedRoute>} />
                    <Route path="/stock/list" element={<ProtectedRoute><ListStock /></ProtectedRoute>} />
                    <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
                    <Route path="/add-generic" element={<ProtectedRoute><AddGeneric /></ProtectedRoute>} />
                    <Route path="/add-brand" element={<ProtectedRoute><AddBrand /></ProtectedRoute>} />
                    <Route path="/purchases" element={<ProtectedRoute><PurchasesReport /></ProtectedRoute>} />
                    <Route path="/prescription-book" element={<ProtectedRoute><PrescriptionBook /></ProtectedRoute>} />
                    <Route path="/sales-reports" element={<ProtectedRoute><SalesReports /></ProtectedRoute>} />

                    <Route path="/manage/generics" element={<ProtectedRoute><GenericsList /></ProtectedRoute>} />
                    <Route path="/edit-generic/:id" element={<ProtectedRoute><GenericEdit /></ProtectedRoute>} />
                    <Route path="/manage/brands" element={<ProtectedRoute><BrandsList /></ProtectedRoute>} />
                    <Route path="/edit-brand/:id" element={<ProtectedRoute><EditBrand /></ProtectedRoute>} />
                    <Route path="/add-supplier" element={<ProtectedRoute><AddSupplier /></ProtectedRoute>} />
                    <Route path="/manage/suppliers" element={<ProtectedRoute><SuppliersList /></ProtectedRoute>} />
                    <Route path="/edit-supplier/:id" element={<ProtectedRoute><EditSupplier /></ProtectedRoute>} />
                    <Route path="/dda-ledger" element={<ProtectedRoute><DDARegister /></ProtectedRoute>} />

                    {/* Restricted to Admins Only */}
                    <Route path="/dda-ledger" element={<AdminRoute><DDARegister /></AdminRoute>} />
                    <Route path="/checklist" element={<AdminRoute><DispensaryChecklist /></AdminRoute>} />
                    <Route path="/manage-users" element={<AdminRoute><UserManagement /></AdminRoute>} />

                    {/* 🛡️ Admin Settings Route */}
                    <Route path="/admin-settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

                    <Route path="*" element={localStorage.getItem("access_token") ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
                </Routes>
            </div>

            <Footer />
        </div>
    );
}

export default App;