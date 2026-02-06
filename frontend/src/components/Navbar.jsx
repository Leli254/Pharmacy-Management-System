// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
    const navigate = useNavigate();
    const token = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");
    const username = localStorage.getItem("username") || "User";

    function handleLogout() {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_role");
        localStorage.removeItem("username");
        navigate("/login");
    }

    return (
        <nav style={navBarStyle}>
            <div style={logoStyle}>
                Pharmacy Tracker
            </div>

            <div style={navLinksContainer}>
                {token ? (
                    <>
                        {/* Primary Navigation */}
                        <div style={groupStyle}>
                            <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
                            <Link to="/stock/list" style={linkStyle}>Inventory</Link>
                            {/* Added Suppliers link */}
                            <Link to="/manage/suppliers" style={linkStyle}>Suppliers</Link>
                            <Link to="/sell-stock" style={linkStyle}>Dispense</Link>
                            <Link to="/prescription-book" style={linkStyle}>Prescriptions</Link>
                            <Link to="/sales-reports" style={linkStyle}>Sales Reports</Link>
                            <Link to="/purchases" style={linkStyle}>Purchases</Link>
                            <Link to="/audit" style={linkStyle}>Audit</Link>

                            {/* Admin Specific Links */}
                            {role === "admin" && (
                                <>
                                    <Link to="/dda-ledger" style={linkStyle}>DDA Register</Link>
                                    <Link to="/manage-users" style={linkStyle}>Manage Users</Link>
                                    {/* New Backup/Settings link */}
                                    <Link to="/admin-settings" style={adminLinkStyle}>Admin Settings</Link>
                                </>
                            )}
                        </div>

                        {/* User Profile & Logout */}
                        <div style={profileStyle}>
                            <div style={userInfoStyle}>
                                <span style={userLabelStyle}>{username}</span>
                                <span style={roleBadgeStyle}>{role}</span>
                            </div>
                            <button onClick={handleLogout} style={logoutButtonStyle}>
                                Logout
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={groupStyle}>
                        <Link to="/login" style={linkStyle}>Login</Link>
                        <Link to="/signup" style={linkStyle}>Signup</Link>
                    </div>
                )}
            </div>
        </nav>
    );
}

// --- Styles ---

const navBarStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 2rem",
    backgroundColor: "#2b6cb0",
    color: "#fff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    position: "sticky",
    top: 0,
    zIndex: 1000
};

const logoStyle = {
    fontWeight: "800",
    fontSize: "1.4rem",
    letterSpacing: "-0.5px"
};

const navLinksContainer = {
    display: "flex",
    gap: "1.5rem",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end"
};

const groupStyle = {
    display: "flex",
    gap: "1.2rem",
    alignItems: "center",
    flexWrap: "wrap"
};

const profileStyle = {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    paddingLeft: "1.2rem",
    borderLeft: "1px solid rgba(255,255,255,0.3)"
};

const userInfoStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    lineHeight: "1.2"
};

const userLabelStyle = {
    fontSize: "0.9rem",
    fontWeight: "600"
};

const roleBadgeStyle = {
    fontSize: "0.7rem",
    textTransform: "uppercase",
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: "2px 6px",
    borderRadius: "4px",
    letterSpacing: "0.5px"
};

const linkStyle = {
    color: "#fff",
    textDecoration: "none",
    fontSize: "0.9rem",
    fontWeight: "500",
    whiteSpace: "nowrap"
};

const adminLinkStyle = {
    ...linkStyle,
    color: "#ebf8ff",
    borderBottom: "1px dashed #bee3f8",
    fontWeight: "bold"
};

const logoutButtonStyle = {
    background: "#c53030",
    border: "none",
    color: "#fff",
    padding: "0.4rem 0.8rem",
    cursor: "pointer",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontWeight: "bold"
};

export default Navbar;