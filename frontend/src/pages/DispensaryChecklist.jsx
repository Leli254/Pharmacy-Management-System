import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api/api";
import axios from "axios";

function DispensaryChecklist() {
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [reconciling, setReconciling] = useState(null);

    const fetchChecklist = async () => {
        setLoading(true);
        try {
            const data = await apiGet("/alerts/checklist");
            const itemsWithInput = data.map(item => ({ ...item, physicalInput: "" }));
            setItems(itemsWithInput);
        } catch (err) {
            console.error("Checklist error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchChecklist(); }, []);

    const filteredItems = items.filter(item =>
        item.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batch_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDownloadPDF = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.get("http://localhost:8000/api/alerts/checklist/pdf", {
                responseType: 'blob',
                headers: { Authorization: `Bearer ${token}` }
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Full_Inventory_Checklist_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert("Error generating PDF.");
        }
    };

    const handleInputChange = (id, value) => {
        setItems(items.map(item => item.id === id ? { ...item, physicalInput: value } : item));
    };

    const submitReconciliation = async (item) => {
        if (item.physicalInput === "" || isNaN(item.physicalInput)) return;
        setReconciling(item.id);
        try {
            await apiPost("/alerts/reconcile", {
                drug_id: item.id,
                physical_quantity: parseInt(item.physicalInput)
            });
            alert(`Verified: ${item.brand_name} updated.`);
            fetchChecklist();
        } catch (err) {
            alert("Update failed.");
        } finally {
            setReconciling(null);
        }
    };

    return (
        <div style={{ maxWidth: "1200px", margin: "2rem auto", padding: "1.5rem", fontFamily: "sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem", flexWrap: "wrap", gap: "20px" }}>
                <div>
                    <h2 style={{ margin: 0 }}>Full Dispensary Inventory Checklist</h2>
                    <p style={{ color: "#666", marginBottom: "15px" }}>Search and verify every batch currently in stock.</p>

                    <input
                        type="text"
                        placeholder="Search brand or batch number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: "350px",
                            padding: "12px",
                            borderRadius: "8px",
                            border: "2px solid #3182ce",
                            fontSize: "15px",
                            outline: "none"
                        }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {/* Updated to Blue for visibility */}
                    <button
                        onClick={fetchChecklist}
                        style={{ padding: "10px 15px", borderRadius: "6px", border: "none", cursor: "pointer", background: "#3182ce", color: "white", fontWeight: "bold" }}
                    >
                        Refresh
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        style={{ padding: "10px 20px", background: "#38a169", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                    >
                        📥 Download PDF
                    </button>
                </div>
            </div>

            {loading ? <p>Loading inventory...</p> : (
                <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#f7fafc", textAlign: "left", borderBottom: "2px solid #edf2f7" }}>
                                <th style={{ padding: "15px" }}>Drug Detail</th>
                                <th style={{ padding: "15px" }}>Status</th>
                                <th style={{ padding: "15px" }}>System Qty</th>
                                <th style={{ padding: "15px" }}>Physical Count</th>
                                <th style={{ padding: "15px" }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: "center", padding: "3rem", color: "#718096" }}>No matching drugs found.</td></tr>
                            ) : (
                                filteredItems.map((item) => (
                                    <tr key={item.id} style={{ borderBottom: "1px solid #edf2f7" }}>
                                        <td style={{ padding: "15px" }}>
                                            <div style={{ fontWeight: "bold" }}>{item.brand_name}</div>
                                            <div style={{ fontSize: "12px", color: "#718096" }}>Batch: {item.batch_number} | Exp: {item.expiry_date}</div>
                                        </td>
                                        <td style={{ padding: "15px" }}>
                                            <span style={{
                                                fontSize: "11px", fontWeight: "bold", padding: "4px 8px", borderRadius: "4px",
                                                background: item.alert_type === 'HEALTHY' ? '#f0fff4' : '#fff5f5',
                                                color: item.alert_type === 'HEALTHY' ? '#2f855a' : '#c53030'
                                            }}>
                                                {item.alert_type}
                                            </span>
                                        </td>
                                        <td style={{ padding: "15px", fontSize: "16px", fontWeight: "600" }}>{item.quantity_digital}</td>
                                        <td style={{ padding: "15px" }}>
                                            <input
                                                type="number"
                                                placeholder="Count..."
                                                value={item.physicalInput}
                                                onChange={(e) => handleInputChange(item.id, e.target.value)}
                                                style={{ width: "80px", padding: "8px", borderRadius: "4px", border: "1px solid #cbd5e0" }}
                                            />
                                        </td>
                                        <td style={{ padding: "15px" }}>
                                            <button
                                                onClick={() => submitReconciliation(item)}
                                                disabled={reconciling === item.id || !item.physicalInput}
                                                style={{
                                                    padding: "8px 12px",
                                                    // Updated to Blue when active
                                                    background: !item.physicalInput ? "#ccc" : "#3182ce",
                                                    color: "white", border: "none", borderRadius: "4px", cursor: "pointer"
                                                }}
                                            >
                                                {reconciling === item.id ? "..." : "Verify"}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default DispensaryChecklist;