import { useState } from "react";
import { apiPost } from "../api/api";

function AdminSettings() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const handleBackup = async () => {
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            // Path matches Swagger /api/admin/backup (api.js adds /api prefix)
            const response = await apiPost("/admin/backup");

            // Backend returns: { "status": "success", "filename": "...", "size_mb": ... }
            setMessage({
                type: "success",
                text: `Success! ${response.message} Filename: ${response.filename} (${response.size_mb} MB)`
            });
        } catch (err) {
            console.error("Backup failed:", err);
            const errorDetail = err.response?.data?.detail || "Backup failed. Check if Docker backend is running.";
            setMessage({
                type: "error",
                text: errorDetail
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <h2 style={headerStyle}>Admin Control Panel</h2>
                <p style={subHeaderStyle}>System Maintenance & Data Integrity</p>

                <hr style={dividerStyle} />

                <div style={contentLayout}>
                    <div style={infoSide}>
                        <h3 style={titleStyle}>Database Backup</h3>
                        <p style={descStyle}>
                            Clicking the button below triggers a <strong>PostgreSQL Dump</strong>.
                            The resulting <code>.sql</code> file will be stored in your local
                            <code>/backups</code> directory.
                        </p>
                        <ul style={listStyle}>
                            <li>Standard SQL format</li>
                            <li>Includes all tables and data</li>
                            <li>Timestamped for versioning</li>
                        </ul>
                    </div>

                    <div style={actionSide}>
                        <button
                            onClick={handleBackup}
                            disabled={loading}
                            style={{
                                ...btnStyle,
                                backgroundColor: loading ? "#cbd5e0" : "#2d3748",
                                cursor: loading ? "not-allowed" : "pointer",
                                transform: loading ? "none" : "scale(1)"
                            }}
                        >
                            {loading ? "Generating Dump..." : "Run Backup Now"}
                        </button>

                        {message.text && (
                            <div style={{
                                ...statusBoxStyle,
                                color: message.type === "success" ? "#276749" : "#9b2c2c",
                                backgroundColor: message.type === "success" ? "#f0fff4" : "#fff5f5",
                                borderColor: message.type === "success" ? "#c6f6d5" : "#fed7d7"
                            }}>
                                {message.text}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Styles remains the same
const containerStyle = { padding: "40px 20px", minHeight: "80vh", backgroundColor: "#f7fafc" };
const cardStyle = { maxWidth: "900px", margin: "0 auto", backgroundColor: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" };
const headerStyle = { margin: "0", color: "#1a202c", fontSize: "24px" };
const subHeaderStyle = { margin: "5px 0 0 0", color: "#718096", fontSize: "14px" };
const dividerStyle = { border: "0", borderTop: "1px solid #edf2f7", margin: "25px 0" };
const contentLayout = { display: "flex", gap: "40px", flexWrap: "wrap" };
const infoSide = { flex: "1", minWidth: "300px" };
const actionSide = { flex: "0 0 320px", display: "flex", flexDirection: "column" };
const titleStyle = { fontSize: "18px", color: "#2d3748", marginBottom: "12px" };
const descStyle = { fontSize: "15px", color: "#4a5568", lineHeight: "1.6", marginBottom: "15px" };
const listStyle = { fontSize: "13px", color: "#718096", paddingLeft: "20px" };
const btnStyle = { width: "100%", padding: "14px", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "16px", transition: "all 0.2s" };
const statusBoxStyle = { marginTop: "20px", padding: "12px", borderRadius: "8px", fontSize: "13px", border: "1px solid", lineHeight: "1.4" };

export default AdminSettings;