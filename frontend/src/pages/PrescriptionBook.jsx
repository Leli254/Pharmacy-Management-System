import React, { useState, useEffect } from "react";
import { apiGet } from "../api/api";

const PrescriptionBook = () => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    useEffect(() => {
        fetchBook();
    }, []);

    const fetchBook = async () => {
        try {
            const data = await apiGet("/stock/prescription-book");
            setEntries(data);
        } catch (err) {
            console.error("Failed to load prescription book", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        const baseUrl = "http://localhost:8000/api/stock/prescription-book/download";
        const token = localStorage.getItem("access_token");

        const params = new URLSearchParams();
        if (startDate) params.append("start_date", startDate);
        if (endDate) params.append("end_date", endDate);
        if (token) params.append("token", token);

        window.open(`${baseUrl}?${params.toString()}`, "_blank");
    };

    const filteredEntries = entries.filter(e => {
        const matchesSearch = e.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.receipt_number.toLowerCase().includes(searchTerm.toLowerCase());

        if (!startDate || !endDate) return matchesSearch;

        const entryDate = e.date.split("T")[0];
        return matchesSearch && (entryDate >= startDate && entryDate <= endDate);
    });

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Register...</div>;

    return (
        <div style={{ padding: "30px", maxWidth: "1400px", margin: "auto", fontFamily: "'Times New Roman', serif" }}>
            <div style={{ borderBottom: "2px solid #000", marginBottom: "20px", display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px' }}>
                <div>
                    <h1 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>Prescription Register</h1>
                    <p style={{ fontStyle: 'italic', color: '#555', margin: 0 }}>Official record of clinical prescriptions dispensed</p>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                    <div style={filterGroup}>
                        <label style={labelStyle}>Search</label>
                        <input
                            type="text"
                            placeholder="Patient/Receipt..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                    <div style={filterGroup}>
                        <label style={labelStyle}>From</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
                    </div>
                    <div style={filterGroup}>
                        <label style={labelStyle}>To</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
                    </div>
                    <button onClick={handleDownload} style={btnStyle}>💾 Download PDF</button>
                    <button onClick={fetchBook} style={{ ...btnStyle, backgroundColor: '#eee', color: '#000' }}>🔄 Refresh</button>
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f4f4f4', borderBottom: '2px solid #000' }}>
                            <th style={thStyle}>Date</th>
                            <th style={thStyle}>Receipt</th>
                            <th style={thStyle}>Patient Particulars</th>
                            <th style={thStyle}>Prescriber / Institution</th>
                            <th style={thStyle}>Medicines Dispensed</th>
                            <th style={thStyle}>Dosage Instructions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEntries.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>No prescription records found.</td></tr>
                        ) : (
                            filteredEntries.map((entry) => (
                                <tr key={entry.id} style={{ borderBottom: '1px solid #ddd' }}>
                                    <td style={tdStyle}>{new Date(entry.date).toLocaleDateString()}</td>
                                    <td style={tdStyle}><code style={{ background: '#eee', padding: '2px 4px' }}>{entry.receipt_number}</code></td>
                                    <td style={tdStyle}>
                                        <strong>{entry.patient_name}</strong><br />
                                        <small>{entry.age || "N/A"} | {entry.sex || "N/A"}</small>
                                    </td>
                                    <td style={tdStyle}>
                                        {entry.prescriber}<br />
                                        <small style={{ color: '#666' }}>{entry.institution}</small>
                                    </td>
                                    <td style={{ ...tdStyle, maxWidth: '250px' }}>{entry.drugs}</td>
                                    <td style={{ ...tdStyle, fontStyle: 'italic', color: '#2c5282' }}>{entry.instructions}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '30px', fontSize: '12px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
                * This document is a legal requirement under the Pharmacy and Poisons Act.
                Confidentiality of patient data must be maintained.
            </div>
        </div>
    );
};

// Styles
const thStyle = { padding: '12px', border: '1px solid #ccc', textAlign: 'left', fontWeight: 'bold', fontSize: '14px' };
const tdStyle = { padding: '12px', border: '1px solid #ccc', verticalAlign: 'top', fontSize: '14px' };
const inputStyle = { padding: '6px', border: '1px solid #000', fontSize: '12px', fontFamily: 'sans-serif' };
const labelStyle = { fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' };
const filterGroup = { display: 'flex', flexDirection: 'column' };
const btnStyle = { padding: '8px 15px', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', height: '32px' };

export default PrescriptionBook;