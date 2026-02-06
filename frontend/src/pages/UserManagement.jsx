import React, { useEffect, useState } from "react";
import { apiGet, apiPatch } from "../api/api"; // Adjust based on your api utility

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await apiGet("/auth/users");
            setUsers(data);
        } catch (err) {
            setError("Failed to load users. Ensure you are an Admin.");
        } finally {
            setLoading(false);
        }
    };

    const toggleRole = async (userId, currentRole) => {
        const newRole = currentRole === "admin" ? "staff" : "admin";
        if (!window.confirm(`Are you sure you want to change this user to ${newRole}?`)) return;

        try {
            await apiPatch(`/auth/users/${userId}/role?new_role=${newRole}`);
            // Update local state to reflect change
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            alert("Failed to update role.");
        }
    };

    if (loading) return <p style={{ textAlign: 'center', padding: '2rem' }}>Loading Users...</p>;

    return (
        <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
            <h2 style={{ color: "#2d3748", borderBottom: "2px solid #3182ce", paddingBottom: "10px" }}>
                User Management
            </h2>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <table style={tableStyle}>
                <thead>
                    <tr style={{ backgroundColor: "#edf2f7" }}>
                        <th style={thStyle}>ID</th>
                        <th style={thStyle}>Full Name</th>
                        <th style={thStyle}>Username</th>
                        <th style={thStyle}>Current Role</th>
                        <th style={thStyle}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                            <td style={tdStyle}>{user.id}</td>
                            <td style={tdStyle}>{user.full_name}</td>
                            <td style={tdStyle}>{user.username}</td>
                            <td style={tdStyle}>
                                <span style={{
                                    ...roleBadgeStyle,
                                    backgroundColor: user.role === "admin" ? "#fed7d7" : "#c6f6d5",
                                    color: user.role === "admin" ? "#9b2c2c" : "#22543d"
                                }}>
                                    {user.role}
                                </span>
                            </td>
                            <td style={tdStyle}>
                                <button
                                    onClick={() => toggleRole(user.id, user.role)}
                                    style={user.role === "admin" ? demoteBtn : promoteBtn}
                                >
                                    {user.role === "admin" ? "Demote to Staff" : "Promote to Admin"}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// --- Internal Styles ---
const tableStyle = { width: "100%", borderCollapse: "collapse", marginTop: "1rem", backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" };
const thStyle = { padding: "12px", textAlign: "left", fontSize: "14px", fontWeight: "600", color: "#4a5568" };
const tdStyle = { padding: "12px", fontSize: "14px", color: "#2d3748" };
const roleBadgeStyle = { padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase" };
const promoteBtn = { padding: "6px 12px", background: "#3182ce", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" };
const demoteBtn = { padding: "6px 12px", background: "#e53e3e", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" };