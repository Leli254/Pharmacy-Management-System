// src/pages/Audit.jsx
import { useEffect, useState } from "react";
import axios from "axios";  // ← This was missing!

// Use a separate axios instance for Audit to bypass Vite proxy quirks
const auditApi = axios.create({
    baseURL: "http://localhost:8000/api",  // Force correct host/port
    timeout: 15000,
    headers: { "Content-Type": "application/json" },
});

// Attach token interceptor (same as your main api.js)
auditApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

function Audit() {
    const [auditLogs, setAuditLogs] = useState([]);
    const [batchFilter, setBatchFilter] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function loadAuditLogs(batch = "") {
        setLoading(true);
        setError("");

        try {
            const query = batch ? `?batch_number=${encodeURIComponent(batch)}` : "";
            const response = await auditApi.get(`/audit${query}`);
            setAuditLogs(response.data || []);
        } catch (err) {
            console.error("Audit request failed:", err);
            const errMsg = err.response?.data?.detail || err.message || "Failed to load audit trail";
            setError(errMsg);
        } finally {
            setLoading(false);
        }
    }

    // Load all logs on mount
    useEffect(() => {
        loadAuditLogs();
    }, []);

    // Handle filter submission
    function handleFilter(e) {
        e.preventDefault();
        loadAuditLogs(batchFilter.trim());
    }

    return (
        <div style={{ maxWidth: "1200px", margin: "2rem auto", padding: "1rem" }}>
            <h2>Stock Audit Trail</h2>

            <form
                onSubmit={handleFilter}
                style={{
                    marginBottom: "1.5rem",
                    display: "flex",
                    gap: "0.75rem",
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                <input
                    type="text"
                    placeholder="Filter by batch number (optional)"
                    value={batchFilter}
                    onChange={(e) => setBatchFilter(e.target.value)}
                    style={{ flex: "1 1 300px", padding: "0.6rem", fontSize: "1rem" }}
                />
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: "0.6rem 1.2rem",
                        background: loading ? "#6c757d" : "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: loading ? "not-allowed" : "pointer",
                    }}
                >
                    {loading ? "Loading..." : "Filter"}
                </button>
            </form>

            {loading && <p style={{ color: "#666" }}>Loading audit records...</p>}
            {error && <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>}

            {!loading && !error && auditLogs.length === 0 && (
                <p style={{ color: "#666", fontStyle: "italic" }}>
                    No audit records found {batchFilter && `(for batch "${batchFilter}")`}.
                </p>
            )}

            {auditLogs.length > 0 && (
                <div style={{ overflowX: "auto", border: "1px solid #dee2e6", borderRadius: "4px" }}>
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            background: "white",
                        }}
                    >
                        <thead>
                            <tr style={{ background: "#f8f9fa", textAlign: "left" }}>
                                <th style={{ padding: "0.8rem", borderBottom: "2px solid #dee2e6" }}>Date</th>
                                <th style={{ padding: "0.8rem", borderBottom: "2px solid #dee2e6" }}>Drug</th>
                                <th style={{ padding: "0.8rem", borderBottom: "2px solid #dee2e6" }}>Batch</th>
                                <th style={{ padding: "0.8rem", borderBottom: "2px solid #dee2e6" }}>Movement</th>
                                <th style={{ padding: "0.8rem", borderBottom: "2px solid #dee2e6" }}>Quantity</th>
                                <th style={{ padding: "0.8rem", borderBottom: "2px solid #dee2e6" }}>Reason</th>
                                <th style={{ padding: "0.8rem", borderBottom: "2px solid #dee2e6" }}>User</th>
                            </tr>
                        </thead>
                        <tbody>
                            {auditLogs.map((log, index) => (
                                <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
                                    <td style={{ padding: "0.8rem" }}>{log.date}</td>
                                    <td style={{ padding: "0.8rem" }}>{log.drug_name}</td>
                                    <td style={{ padding: "0.8rem" }}>{log.batch_number}</td>
                                    <td style={{ padding: "0.8rem" }}>{log.movement_type}</td>
                                    <td style={{ padding: "0.8rem" }}>
                                        {log.quantity_changed > 0 ? "+" : ""}
                                        {log.quantity_changed}
                                    </td>
                                    <td style={{ padding: "0.8rem" }}>{log.reason}</td>
                                    <td style={{ padding: "0.8rem" }}>{log.username || "System"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default Audit;