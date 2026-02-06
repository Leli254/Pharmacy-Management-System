import React, { useState, useEffect } from "react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";
import { apiGet } from "../api/api";

export default function SalesReports() {
    const role = localStorage.getItem("user_role");
    const isAdmin = role === "admin";

    const [stats, setStats] = useState({
        revenue: 0,
        profit: 0,
        transaction_count: 0,
        chart_data: [],
        pie_data: [],
        records: []
    });
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({
        user_id: "",
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
    });

    const COLORS = ["#3182ce", "#38a169", "#d69e2e", "#e53e3e", "#805ad5"];

    const fetchUsers = async () => {
        try {
            const data = await apiGet("/auth/users");
            setUsers(data);
        } catch (err) {
            console.error("Error fetching users", err);
        }
    };

    const handleFilter = async () => {
        const path = isAdmin ? "/analytics/admin/overview" : "/analytics/my-sales";
        const params = new URLSearchParams();
        if (filters.user_id && filters.user_id !== "") {
            params.append("user_id", filters.user_id);
        }
        params.append("start_date", filters.start_date);
        params.append("end_date", filters.end_date);

        try {
            const data = await apiGet(`${path}?${params.toString()}`);
            setStats(data);
        } catch (err) {
            console.error("Error fetching analytics", err);
        }
    };

    const handleReprint = async (txId) => {
        try {
            const responseData = await apiGet(`/audit/reprint/${txId}`, null, { responseType: 'blob' });
            const blob = new Blob([responseData], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Receipt_${txId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Reprint failed:", err);
            alert("Failed to reprint receipt");
        }
    };

    const handleExport = async (format) => {
        const params = new URLSearchParams();
        params.append("format", format);
        if (filters.user_id) params.append("user_id", filters.user_id);
        params.append("start_date", filters.start_date);
        params.append("end_date", filters.end_date);

        try {
            // Ensure your apiGet is configured to handle the third argument (options) for blobs
            const responseData = await apiGet(`/analytics/export-report?${params.toString()}`, null, { responseType: 'blob' });
            const blob = new Blob([responseData], {
                type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Sales_Report_${filters.start_date}.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export failed", err);
            alert("Failed to export report");
        }
    };

    useEffect(() => {
        const initDashboard = async () => {
            if (isAdmin) {
                await fetchUsers();
            }
            await handleFilter();
        };
        initDashboard();
    }, []);

    return (
        <div style={containerStyle}>
            <header style={headerStyle}>
                <h2>{isAdmin ? "Admin Sales Dashboard" : "My Sales Overview"}</h2>
                <div style={filterBar}>
                    {isAdmin && (
                        <select
                            style={inputStyle}
                            value={filters.user_id}
                            onChange={e => setFilters({ ...filters, user_id: e.target.value })}
                        >
                            <option value="">All Users</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                        </select>
                    )}
                    <input
                        type="date"
                        style={inputStyle}
                        value={filters.start_date}
                        onChange={e => setFilters({ ...filters, start_date: e.target.value })}
                    />
                    <input
                        type="date"
                        style={inputStyle}
                        value={filters.end_date}
                        onChange={e => setFilters({ ...filters, end_date: e.target.value })}
                    />
                    <button onClick={handleFilter} style={btnStyle}>Apply Filters</button>

                    {/* Admin Export Buttons */}
                    {isAdmin && (
                        <>
                            <button onClick={() => handleExport('pdf')} style={{ ...btnStyle, backgroundColor: '#e53e3e' }}>
                                📥 Export PDF
                            </button>
                            <button onClick={() => handleExport('excel')} style={{ ...btnStyle, backgroundColor: '#38a169' }}>
                                📊 Export Excel
                            </button>
                        </>
                    )}
                </div>
            </header>

            <div style={statsGrid}>
                <div style={card}>
                    <span style={label}>Total Revenue</span>
                    <h3 style={val}>KES {stats.revenue?.toLocaleString() || 0}</h3>
                </div>
                {isAdmin && (
                    <div style={{ ...card, borderLeft: "4px solid #38a169" }}>
                        <span style={label}>Gross Profit</span>
                        <h3 style={{ ...val, color: "#38a169" }}>KES {stats.profit?.toLocaleString() || 0}</h3>
                    </div>
                )}
                <div style={card}>
                    <span style={label}>Transactions</span>
                    <h3 style={val}>{stats.transaction_count || stats.count || 0}</h3>
                </div>
            </div>

            <div style={chartsWrapper}>
                <div style={{ ...chartCard, flex: 2, minWidth: "300px" }}>
                    <h4 style={chartTitle}>Revenue Trend</h4>
                    <div style={responsiveContainerFix}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.chart_data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" fontSize={12} />
                                <YAxis fontSize={12} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="sales" stroke="#3182ce" strokeWidth={3} dot={{ r: 4 }} name="Revenue (KES)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {isAdmin && stats.pie_data?.length > 0 && (
                    <div style={{ ...chartCard, flex: 1, minWidth: "300px" }}>
                        <h4 style={chartTitle}>Top 5 Profit by Brand</h4>
                        <div style={responsiveContainerFix}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stats.pie_data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {stats.pie_data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ marginTop: "2rem" }}>
                <h3 style={{ color: "#2d3748", marginBottom: "1rem" }}>Recent Records</h3>
                <div style={tableContainerStyle}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr>
                                <th style={thStyle}>Time</th>
                                <th style={thStyle}>Receipt #</th>
                                <th style={thStyle}>Client</th>
                                <th style={thStyle}>Total</th>
                                <th style={thStyle}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.records && stats.records.length > 0 ? (
                                stats.records.map((tx) => (
                                    <tr key={tx.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                                        <td style={tdStyle}>{new Date(tx.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                                        <td style={tdStyle}>{tx.receipt_number}</td>
                                        <td style={tdStyle}>{tx.client_name || "Walk-in"}</td>
                                        <td style={{ ...tdStyle, fontWeight: 'bold' }}>KES {tx.total_amount?.toLocaleString()}</td>
                                        <td style={tdStyle}>
                                            <button onClick={() => handleReprint(tx.id)} style={actionBtnStyle}>
                                                🖨️ Reprint PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#a0aec0' }}>
                                        No transaction records available.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// STYLES
const containerStyle = { padding: "2rem", backgroundColor: "#f8fafc", minHeight: "100vh" };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" };
const filterBar = { display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" };
const inputStyle = { padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e0", fontSize: "14px" };
const btnStyle = { padding: "10px 20px", backgroundColor: "#3182ce", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" };
const statsGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "2rem" };
const card = { padding: "1.5rem", background: "white", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", borderLeft: "4px solid #3182ce" };
const label = { fontSize: "14px", color: "#64748b", fontWeight: "600" };
const val = { fontSize: "28px", margin: "10px 0 0", color: "#1e293b" };
const chartsWrapper = { display: "flex", gap: "20px", flexWrap: "wrap", width: "100%" };
const chartCard = { background: "white", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" };
const chartTitle = { marginBottom: '1.5rem', color: '#4a5568' };
const responsiveContainerFix = { height: "350px", width: "100%", position: "relative" };

const tableContainerStyle = { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
const thStyle = { padding: '12px 15px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontSize: '11px', color: '#718096', textTransform: 'uppercase' };
const tdStyle = { padding: '12px 15px', fontSize: '13px', color: '#2d3748' };

const actionBtnStyle = {
    padding: '8px 14px',
    backgroundColor: '#3182ce',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};