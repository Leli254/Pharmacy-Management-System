// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
    const navigate = useNavigate();
    const token = localStorage.getItem("access_token");

    function handleLogout() {
        localStorage.removeItem("access_token");
        navigate("/login");
    }

    return (
        <nav
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1rem 2rem",
                backgroundColor: "#007bff",
                color: "#fff",
            }}
        >
            <div style={{ fontWeight: "bold", fontSize: "1.25rem" }}>
                Pharmacy Tracker
            </div>

            <div style={{ display: "flex", gap: "1.5rem" }}>
                {token ? (
                    <>
                        <Link to="/dashboard" style={{ color: "#fff", textDecoration: "none" }}>
                            Dashboard
                        </Link>
                        <Link to="/alerts" style={{ color: "#fff", textDecoration: "none" }}>
                            Alerts
                        </Link>
                        <Link to="/stock/list" style={{ color: "#fff", textDecoration: "none" }}>
                            View Stock
                        </Link>
                        <Link to="/add-stock" style={{ color: "#fff", textDecoration: "none" }}>
                            Add Stock
                        </Link>
                        <Link to="/sell-stock" style={{ color: "#fff", textDecoration: "none" }}>
                            Sell Stock
                        </Link>
                        <Link to="/audit" style={{ color: "#fff", textDecoration: "none" }}>
                            Audit
                        </Link>
                        <button
                            onClick={handleLogout}
                            style={{
                                background: "transparent",
                                border: "1px solid #fff",
                                color: "#fff",
                                padding: "0.25rem 0.75rem",
                                cursor: "pointer",
                                borderRadius: "4px",
                            }}
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login" style={{ color: "#fff", textDecoration: "none" }}>
                            Login
                        </Link>
                        <Link to="/signup" style={{ color: "#fff", textDecoration: "none" }}>
                            Signup
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}

export default Navbar;