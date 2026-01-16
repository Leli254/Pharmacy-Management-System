// src/pages/Alerts.jsx
import { useEffect, useState } from "react";
import { apiGet } from "../api/api";

function Alerts() {
    const [alerts, setAlerts] = useState({
        near_expiry: [],
        low_stock: [],
        controlled_drugs_attention: [],
        note: "",
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchAlerts = async () => {
        setLoading(true);
        setError("");

        try {
            const data = await apiGet("/alerts/alerts/", {
                params: { days: 30, low_stock_threshold: 10 },
            });
            setAlerts(data);
        } catch (err) {
            console.error("Failed to load alerts:", err);
            const errMsg = err.response?.data?.detail || err.message || "Failed to load alerts";
            setError(errMsg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, [refreshKey]);

    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    return (
        <div style={{ maxWidth: "1400px", margin: "2rem auto", padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2>Pharmacy Alerts</h2>
                <button
                    onClick={handleRefresh}
                    disabled={loading}
                    style={{
                        padding: "0.6rem 1.2rem",
                        background: loading ? "#6c757d" : "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: loading ? "not-allowed" : "pointer",
                    }}
                >
                    {loading ? "Refreshing..." : "Refresh Alerts"}
                </button>
            </div>

            {error && (
                <p style={{ color: "red", fontWeight: "bold", marginBottom: "1rem" }}>{error}</p>
            )}

            {loading ? (
                <p style={{ color: "#666" }}>Loading alerts...</p>
            ) : (
                <>
                    {/* Note from backend */}
                    {alerts.note && (
                        <p style={{ color: "#555", fontStyle: "italic", marginBottom: "1.5rem" }}>
                            {alerts.note}
                        </p>
                    )}

                    {/* Near Expiry */}
                    <section style={{ marginBottom: "2rem" }}>
                        <h3 style={{ color: "#e67e22" }}>Near Expiry (within 30 days)</h3>
                        {alerts.near_expiry.length === 0 ? (
                            <p style={{ color: "#666" }}>No drugs nearing expiry.</p>
                        ) : (
                            <div style={{ overflowX: "auto", border: "1px solid #dee2e6", borderRadius: "4px" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
                                    <thead>
                                        <tr style={{ background: "#fff3e0" }}>
                                            <th style={{ padding: "0.8rem" }}>Medicine</th>
                                            <th style={{ padding: "0.8rem" }}>Batch</th>
                                            <th style={{ padding: "0.8rem" }}>Expiry Date</th>
                                            <th style={{ padding: "0.8rem" }}>Quantity</th>
                                            <th style={{ padding: "0.8rem" }}>Unit Price (KES)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {alerts.near_expiry.map((drug, index) => (
                                            <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
                                                <td style={{ padding: "0.8rem" }}>{drug.name}</td>
                                                <td style={{ padding: "0.8rem" }}>{drug.batch_number}</td>
                                                <td style={{ padding: "0.8rem", color: "#e67e22" }}>{drug.expiry_date}</td>
                                                <td style={{ padding: "0.8rem" }}>{drug.quantity}</td>
                                                <td style={{ padding: "0.8rem" }}>{drug.unit_price.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {/* Low Stock */}
                    <section style={{ marginBottom: "2rem" }}>
                        <h3 style={{ color: "#f1c40f" }}>Low Stock</h3>
                        {alerts.low_stock.length === 0 ? (
                            <p style={{ color: "#666" }}>No low stock items.</p>
                        ) : (
                            <div style={{ overflowX: "auto", border: "1px solid #dee2e6", borderRadius: "4px" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
                                    <thead>
                                        <tr style={{ background: "#fff9e6" }}>
                                            <th style={{ padding: "0.8rem" }}>Medicine</th>
                                            <th style={{ padding: "0.8rem" }}>Batch</th>
                                            <th style={{ padding: "0.8rem" }}>Expiry Date</th>
                                            <th style={{ padding: "0.8rem" }}>Quantity</th>
                                            <th style={{ padding: "0.8rem" }}>Unit Price (KES)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {alerts.low_stock.map((drug, index) => (
                                            <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
                                                <td style={{ padding: "0.8rem" }}>{drug.name}</td>
                                                <td style={{ padding: "0.8rem" }}>{drug.batch_number}</td>
                                                <td style={{ padding: "0.8rem" }}>{drug.expiry_date}</td>
                                                <td style={{ padding: "0.8rem", color: "#e67e22" }}>{drug.quantity}</td>
                                                <td style={{ padding: "0.8rem" }}>{drug.unit_price.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {/* Controlled Drugs Attention */}
                    <section>
                        <h3 style={{ color: "#c0392b" }}>Controlled Drugs Requiring Attention</h3>
                        {alerts.controlled_drugs_attention.length === 0 ? (
                            <p style={{ color: "#666" }}>No controlled drugs in alert categories.</p>
                        ) : (
                            <div style={{ overflowX: "auto", border: "1px solid #dee2e6", borderRadius: "4px" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
                                    <thead>
                                        <tr style={{ background: "#ffebee" }}>
                                            <th style={{ padding: "0.8rem" }}>Medicine</th>
                                            <th style={{ padding: "0.8rem" }}>Batch</th>
                                            <th style={{ padding: "0.8rem" }}>Expiry Date</th>
                                            <th style={{ padding: "0.8rem" }}>Quantity</th>
                                            <th style={{ padding: "0.8rem" }}>Unit Price (KES)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {alerts.controlled_drugs_attention.map((drug, index) => (
                                            <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
                                                <td style={{ padding: "0.8rem" }}>{drug.name}</td>
                                                <td style={{ padding: "0.8rem" }}>{drug.batch_number}</td>
                                                <td style={{ padding: "0.8rem" }}>{drug.expiry_date}</td>
                                                <td style={{ padding: "0.8rem" }}>{drug.quantity}</td>
                                                <td style={{ padding: "0.8rem" }}>{drug.unit_price.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}

export default Alerts;