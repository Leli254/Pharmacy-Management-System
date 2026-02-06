import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../api/api";

function Alerts() {
    const navigate = useNavigate();
    const userRole = localStorage.getItem("user_role");

    const [alerts, setAlerts] = useState({
        near_expiry: [],
        low_stock: [],
        controlled_attention: [],
        note: "",
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchAlerts = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await apiGet("/alerts/");
            setAlerts(data);
        } catch (err) {
            console.error("Failed to load alerts:", err);
            setError(err.response?.data?.detail || "System Error: Check backend logs for Product/Drug join errors.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, [refreshKey]);

    const calculateDaysLeft = (dateString) => {
        const diff = new Date(dateString) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    return (
        <div style={{ maxWidth: "1400px", margin: "2rem auto", padding: "1.5rem", fontFamily: 'Inter, system-ui, sans-serif' }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "10px" }}>
                <div>
                    <h2 style={{ margin: 0, color: '#1a202c' }}>Pharmacy Intelligence Alerts</h2>
                    {alerts.note && <p style={{ margin: '5px 0 0 0', color: "#718096", fontSize: '14px' }}>{alerts.note}</p>}
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                    {userRole === "admin" && (
                        <button
                            onClick={() => navigate("/checklist")}
                            style={{ padding: "0.8rem 1.5rem", background: "white", color: "#2d3748", border: "1px solid #cbd5e0", borderRadius: "6px", cursor: "pointer", fontWeight: '600' }}
                        >
                            📋 Verify Physical Stock
                        </button>
                    )}

                    <button
                        onClick={() => setRefreshKey(k => k + 1)}
                        disabled={loading}
                        style={{ padding: "0.8rem 1.5rem", background: loading ? "#cbd5e0" : "#3182ce", color: "white", border: "none", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer", fontWeight: '600' }}
                    >
                        {loading ? "Scanning Inventory..." : "Refresh Alerts"}
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ padding: '1rem', background: '#fff5f5', border: '1px solid #feb7b7', color: '#c53030', borderRadius: '6px', marginBottom: '1.5rem' }}>
                    <strong>Connection Error:</strong> {error}
                </div>
            )}

            {!loading && (
                <>
                    <AlertSection
                        title="Near Expiry Risks"
                        color="#e67e22"
                        data={alerts.near_expiry}
                        type="expiry"
                        calcDays={calculateDaysLeft}
                        emptyMessage="All drugs in pharmacy are not expiring soon."
                    />

                    <AlertSection
                        title="Stock Replenishment Needed"
                        color="#3182ce"
                        data={alerts.low_stock}
                        type="stock"
                        emptyMessage="All stock levels are currently above reorder thresholds."
                    />

                    <AlertSection
                        title="Controlled Substances (DDA Oversight)"
                        color="#c53030"
                        data={alerts.controlled_attention}
                        type="controlled"
                        calcDays={calculateDaysLeft}
                        emptyMessage="No controlled drugs currently in stock."
                    />
                </>
            )}
        </div>
    );
}

function AlertSection({ title, color, data, type, calcDays, emptyMessage }) {
    return (
        <section style={{ marginBottom: "3rem" }}>
            <h3 style={{ color, borderLeft: `4px solid ${color}`, paddingLeft: '12px', marginBottom: '1rem' }}>{title}</h3>
            {data.length === 0 ? (
                <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e0', color: '#718096', textAlign: 'center' }}>
                    {emptyMessage}
                </div>
            ) : (
                <div style={{ overflowX: "auto", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", borderRadius: "8px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
                        <thead>
                            <tr style={{ background: "#f7fafc", textAlign: 'left' }}>
                                <th style={{ padding: "1rem" }}>Brand Name</th>
                                <th style={{ padding: "1rem" }}>Batch</th>
                                <th style={{ padding: "1rem" }}>{type === 'stock' ? 'Quantity' : 'Expiry Date'}</th>
                                <th style={{ padding: "1rem" }}>Status</th>
                                <th style={{ padding: "1rem" }}>Unit Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((drug) => {
                                const daysLeft = calcDays ? calcDays(drug.expiry_date) : null;
                                let badgeLabel = "";
                                let badgeColor = { bg: "#ebf8ff", text: "#2b6cb0" };

                                if (type === 'expiry') {
                                    badgeLabel = daysLeft <= 0 ? "EXPIRED" : `${daysLeft} Days Left`;
                                    if (daysLeft < 30) badgeColor = { bg: "#fff5f5", text: "#c53030" };
                                } else if (type === 'stock') {
                                    badgeLabel = `Below Reorder (${drug.reorder_level})`;
                                    badgeColor = { bg: "#fffaf0", text: "#dd6b20" };
                                } else if (type === 'controlled') {
                                    badgeLabel = "DDA MONITOR";
                                    badgeColor = { bg: "#fff5f5", text: "#c53030" };
                                }

                                return (
                                    <tr key={drug.id} style={{ borderBottom: "1px solid #edf2f7" }}>
                                        <td style={{ padding: "1rem", fontWeight: "600" }}>{drug.brand_name}</td>
                                        <td style={{ padding: "1rem" }}>{drug.batch_number}</td>
                                        <td style={{ padding: "1rem" }}>
                                            {type === 'stock' ? `${drug.quantity} units` : drug.expiry_date}
                                        </td>
                                        <td style={{ padding: "1rem" }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                background: badgeColor.bg,
                                                color: badgeColor.text,
                                                border: type === 'controlled' ? '1px solid #feb2b2' : 'none'
                                            }}>
                                                {badgeLabel}
                                            </span>
                                        </td>
                                        <td style={{ padding: "1rem" }}>
                                            KES {(drug.unit_price || 0).toFixed(2)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}

export default Alerts;