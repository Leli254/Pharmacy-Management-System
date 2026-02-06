import React, { useState, useEffect, useMemo } from "react";
import { apiGet } from "../api/api";

const DDARegister = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const logs = await apiGet("/stock/dda-ledger");
            setData(logs);
        } catch (err) {
            console.error("Failed to fetch DDA logs:", err);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Calculate running balance per medication
     */
    const processedData = useMemo(() => {
        // Sort oldest first for balance calculation
        const sorted = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        const balances = {};
        const enriched = sorted.map(entry => {
            const drugKey = entry.brand_name;
            if (!balances[drugKey]) balances[drugKey] = 0;

            if (entry.entry_type === "RECEIVE") {
                balances[drugKey] += entry.quantity;
            } else {
                balances[drugKey] -= entry.quantity;
            }

            return { ...entry, running_balance: balances[drugKey] };
        });

        // Show newest first in table
        return enriched.reverse();
    }, [data]);

    // Date filtering logic for UI
    const filteredData = processedData.filter(entry => {
        if (!startDate || !endDate) return true;
        const entryDate = entry.timestamp.split("T")[0];
        return entryDate >= startDate && entryDate <= endDate;
    });

    const handleDownload = () => {
        // Points to backend directly through proxy or absolute URL
        const baseUrl = "http://localhost:8000/api/stock/dda-ledger/download";
        const token = localStorage.getItem("access_token"); 
        
        const params = new URLSearchParams();
        if (startDate) params.append("start_date", startDate);
        if (endDate) params.append("end_date", endDate);
        if (token) params.append("token", token); // Pass token for authentication

        const url = `${baseUrl}?${params.toString()}`;
        window.open(url, "_blank");
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Legal Register...</div>;

    return (
        <div style={{ padding: "30px", maxWidth: "1400px", margin: "auto", fontFamily: "'Courier New', Courier, monospace" }}>

            {/* Header Section */}
            <div style={{ borderBottom: "3px solid #000", marginBottom: "20px", display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: "10px" }}>
                <div>
                    <h1 style={{ margin: 0, textTransform: 'uppercase', fontSize: "24px" }}>Dangerous Drugs Register (DDA)</h1>
                    <p style={{ margin: "5px 0 0", color: "#555" }}>Official record of controlled substance movements</p>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontFamily: 'sans-serif' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '10px', fontWeight: 'bold' }}>FROM</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '10px', fontWeight: 'bold' }}>TO</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
                    </div>
                    <button onClick={handleDownload} style={btnStyle}>
                        💾 Download PDF
                    </button>
                    <button onClick={fetchData} style={{ ...btnStyle, backgroundColor: '#eee', color: '#000' }}>
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Register Table */}
            <div style={{ overflowX: 'auto', boxShadow: "5px 5px 0px #ccc", border: "2px solid #000" }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: "#fff" }}>
                    <thead>
                        <tr style={{ backgroundColor: '#000', color: '#fff' }}>
                            <th style={thStyle}>Date/Time</th>
                            <th style={thStyle}>Medication (Batch)</th>
                            <th style={thStyle}>Transaction</th>
                            <th style={thStyle}>Person / Entity</th>
                            <th style={thStyle}>Ref Number</th>
                            <th style={thStyle}>Qty</th>
                            <th style={{ ...thStyle, backgroundColor: "#444" }}>Balance</th>
                            <th style={thStyle}>Pharmacist</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', fontStyle: 'italic' }}>
                                    No records found for the selected period.
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((entry, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #000' }}>
                                    <td style={tdStyle}>{new Date(entry.timestamp).toLocaleString()}</td>
                                    <td style={tdStyle}>
                                        <strong>{entry.brand_name}</strong><br />
                                        <small style={{ color: "#666" }}>Batch: {entry.batch_number}</small>
                                    </td>
                                    <td style={{ ...tdStyle, fontWeight: 'bold', color: entry.entry_type === 'RECEIVE' ? 'green' : 'red' }}>
                                        {entry.entry_type}
                                    </td>
                                    <td style={tdStyle}>
                                        {entry.entity_name}
                                        {entry.prescriber && <div style={{ fontSize: '10px', color: '#666' }}>Dr: {entry.prescriber}</div>}
                                    </td>
                                    <td style={tdStyle}><code>{entry.ref_number}</code></td>
                                    <td style={{ ...tdStyle, fontWeight: 'bold', textAlign: 'center' }}>
                                        {entry.entry_type === 'RECEIVE' ? `+${entry.quantity}` : `-${entry.quantity}`}
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold', backgroundColor: '#f9f9f9', fontSize: '16px' }}>
                                        {entry.running_balance}
                                    </td>
                                    <td style={tdStyle}>{entry.user_name}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '20px', fontSize: '12px', fontStyle: 'italic', color: "#666" }}>
                * This DDA Register is generated dynamically from stock movement logs.
                Any discrepancies should be reported to the Superintendent Pharmacist immediately.
            </div>
        </div>
    );
};

const thStyle = { padding: '12px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' };
const tdStyle = { padding: '12px', fontSize: '13px', borderRight: '1px solid #eee' };
const inputStyle = { padding: '6px', border: '1px solid #000', borderRadius: '0px', fontSize: '12px' };
const btnStyle = { padding: '10px 15px', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', alignSelf: 'flex-end' };

export default DDARegister;