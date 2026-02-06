import React, { useEffect, useState } from "react";
import { apiGet } from "../api/api";

function Audit() {
    const [view, setView] = useState("inventory");
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const loadData = async () => {
        console.log(`[Audit] Loading ${view} data...`);
        setLoading(true);
        setError("");
        try {
            const endpoint = view === "inventory" ? "/audit/inventory" : "/audit/sales";
            const params = {};
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            const responseData = await apiGet(endpoint, params);
            console.log(`[Audit] Successfully loaded ${responseData.length} records.`);
            setData(responseData || []);
        } catch (err) {
            console.error("[Audit] Error loading data:", err);
            setError(err.status === 403 ? "Access Denied: Admins Only" : "Failed to load audit data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [view]);

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        loadData();
    };

    const handleReprint = async (txId) => {
        console.log(`[Audit] Requesting reprint for Transaction ID: ${txId}`);
        try {
            // Using our specialized apiGet that supports blobs
            const responseData = await apiGet(`/audit/reprint/${txId}`, null, { responseType: 'blob' });

            const blob = new Blob([responseData], { type: 'application/pdf' });
            console.log(`[Audit] Reprint PDF received, size: ${blob.size} bytes`);

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Reprint_${txId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("[Audit] Reprint failed:", err);
            alert("Failed to reprint receipt");
        }
    };

    const badgeStyle = (type) => ({
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        background: type === 'DISPENSE' ? '#fed7d7' : '#c6f6d5',
        color: type === 'DISPENSE' ? '#822727' : '#22543d'
    });

    return (
        <div style={{ maxWidth: "1300px", margin: "2rem auto", padding: "20px", fontFamily: 'system-ui, sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: '#2d3748', margin: 0 }}>Audit Control Panel</h2>
                <div style={{ display: 'flex', gap: '2px', background: '#edf2f7', padding: '4px', borderRadius: '8px' }}>
                    <button
                        onClick={() => setView("inventory")}
                        style={{ ...tabBtnStyle, background: view === 'inventory' ? 'white' : 'transparent', fontWeight: view === 'inventory' ? 'bold' : 'normal' }}
                    >Inventory Logs</button>
                    <button
                        onClick={() => setView("sales")}
                        style={{ ...tabBtnStyle, background: view === 'sales' ? 'white' : 'transparent', fontWeight: view === 'sales' ? 'bold' : 'normal' }}
                    >Sales History</button>
                </div>
            </div>

            <form onSubmit={handleFilterSubmit} style={filterBarStyle}>
                <div style={{ flex: 1 }}>
                    <label style={labelStyle}>START DATE</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={labelStyle}>END DATE</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
                </div>
                <button type="submit" style={btnPrimaryStyle}>Apply Filter</button>
                <button type="button" onClick={() => { setStartDate(""); setEndDate(""); loadData(); }} style={btnSecondaryStyle}>Clear</button>
            </form>

            {error && <div style={errorStyle}>{error}</div>}

            <div style={tableContainerStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc' }}>
                        {view === "inventory" ? (
                            <tr>
                                <th style={thStyle}>Date</th>
                                <th style={thStyle}>Item</th>
                                <th style={thStyle}>Type</th>
                                <th style={thStyle}>Qty</th>
                                <th style={thStyle}>Reason</th>
                                <th style={thStyle}>User</th>
                            </tr>
                        ) : (
                            <tr>
                                <th style={thStyle}>Time</th>
                                <th style={thStyle}>Receipt #</th>
                                <th style={thStyle}>Client Name</th>
                                <th style={thStyle}>Amount</th>
                                <th style={thStyle}>Sold By</th>
                                <th style={thStyle}>Action</th>
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center' }}>Loading records...</td></tr>
                        ) : data.length > 0 ? data.map((row, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #edf2f7' }}>
                                <td style={tdStyle}>
                                    {view === "inventory"
                                        ? row.date
                                        : new Date(row.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                </td>
                                <td style={tdStyle}>{view === "inventory" ? row.drug_name : row.receipt_number}</td>
                                {view === "inventory" ? (
                                    <>
                                        <td style={tdStyle}><span style={badgeStyle(row.movement_type)}>{row.movement_type}</span></td>
                                        <td style={{ ...tdStyle, fontWeight: 'bold', color: row.quantity_changed > 0 ? '#38a169' : '#e53e3e' }}>
                                            {row.quantity_changed > 0 ? `+${row.quantity_changed}` : row.quantity_changed}
                                        </td>
                                        <td style={tdStyle}>{row.reason}</td>
                                    </>
                                ) : (
                                    <>
                                        <td style={tdStyle}>{row.client_name || "Walk-in"}</td>
                                        <td style={{ ...tdStyle, fontWeight: 'bold' }}>
                                            KES {row.total_amount?.toLocaleString()}
                                        </td>
                                    </>
                                )}
                                <td style={tdStyle}>{row.username || "System"}</td>
                                {view === "sales" && (
                                    <td style={tdStyle}>
                                        <button onClick={() => handleReprint(row.id)} style={actionBtnStyle}>
                                            Reprint PDF
                                        </button>
                                    </td>
                                )}
                            </tr>
                        )) : (
                            <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#a0aec0' }}>No matching records found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// STYLES
const filterBarStyle = { display: 'flex', gap: '15px', alignItems: 'flex-end', marginBottom: '25px', background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' };
const labelStyle = { fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '5px', color: '#718096', textTransform: 'uppercase' };
const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px' };
const thStyle = { padding: '15px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontSize: '12px', color: '#4a5568', textTransform: 'uppercase' };
const tdStyle = { padding: '15px', fontSize: '14px', color: '#2d3748' };
const tabBtnStyle = { padding: '8px 16px', color: '#2d3748', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: '0.2s' };
const btnPrimaryStyle = { padding: '9px 20px', background: '#2d3748', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const btnSecondaryStyle = { padding: '9px 20px', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '6px', cursor: 'pointer' };
const errorStyle = { background: '#fff5f5', color: '#c53030', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', border: '1px solid #feb2b2' };
const tableContainerStyle = { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
const actionBtnStyle = { padding: '6px 12px', background: '#edf2f7', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' };

export default Audit;