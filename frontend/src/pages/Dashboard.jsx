import React, { useState, useEffect } from "react";
import { apiGet } from "../api/api";
import { Link } from "react-router-dom";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Legend, Cell
} from 'recharts';

export default function Dashboard() {
    const [stats, setStats] = useState({
        lowStockCount: 0,
        expiringSoonCount: 0,
        todaySales: 0,
        totalItems: 0
    });
    const [chartData, setChartData] = useState([]);
    const [pieData, setPieData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [inventory, salesData] = await Promise.all([
                apiGet("/stock/"),
                apiGet("/audit/sales")
            ]);

            const safeInventory = inventory || [];
            const safeSales = salesData || [];

            // 1. Core KPIs
            const lowStock = safeInventory.filter(item => item.quantity <= (item.reorder_level || 0)).length;

            const today = new Date();
            const sixtyDays = new Date();
            sixtyDays.setDate(today.getDate() + 60);

            const expiringSoon = safeInventory.filter(item => {
                const expiry = new Date(item.expiry_date);
                return expiry <= sixtyDays && expiry >= today;
            }).length;

            const todayStr = today.toISOString().split('T')[0];
            const todaySalesTotal = safeSales
                .filter(tx => tx.timestamp && tx.timestamp.startsWith(todayStr))
                .reduce((sum, tx) => sum + tx.total_amount, 0);

            // 2. Prepare Chart Data: Top 5 Selling Items
            const itemMap = {};
            safeSales.forEach(tx => {
                if (tx.items) {
                    tx.items.forEach(item => {
                        itemMap[item.drug_name] = (itemMap[item.drug_name] || 0) + item.quantity;
                    });
                }
            });

            const sortedItems = Object.keys(itemMap)
                .map(itemName => ({ name: itemName, sales: itemMap[itemName] }))
                .sort((a, b) => b.sales - a.sales)
                .slice(0, 5);

            // 3. Prepare Pie Data: Controlled vs Regular
            const controlledCount = safeInventory.filter(i => i.is_controlled === true).length;
            const regularCount = safeInventory.length - controlledCount;

            setStats({
                lowStockCount: lowStock,
                expiringSoonCount: expiringSoon,
                todaySales: todaySalesTotal,
                totalItems: safeInventory.length
            });
            setChartData(sortedItems);

            setPieData([
                { name: 'Regular Stock', value: regularCount, color: '#4A5568' },
                { name: 'Controlled Substances', value: controlledCount, color: '#E53E3E' }
            ]);
        } catch (err) {
            console.error("Dashboard data load failed:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Analyzing Pharmacy Data...</div>;

    return (
        <div style={{ maxWidth: "1250px", margin: "2rem auto", padding: "0 20px", fontFamily: 'sans-serif', color: '#2d3748' }}>
            <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: "2rem", margin: 0 }}>Management Dashboard</h1>
                    <p style={{ color: "#718096", marginTop: '5px' }}>Business intelligence and inventory health.</p>
                </div>
                {/* Fixed width container to make buttons appear "long" and uniform */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '180px' }}>
                    <button onClick={fetchDashboardData} style={refreshBtnStyle}>Refresh Data</button>
                    <Link to="/alerts" style={alertsBtnStyle}>Alerts</Link>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <StatCard label="Today's Revenue" value={`KES ${stats.todaySales.toLocaleString()}`} color="#2d3748" subtext="Gross sales today" />
                <StatCard label="Critical Stock" value={stats.lowStockCount} color={stats.lowStockCount > 0 ? "#e53e3e" : "#38a169"} subtext="Refill required immediately" />
                <StatCard label="Expiring Soon" value={stats.expiringSoonCount} color={stats.expiringSoonCount > 0 ? "#dd6b20" : "#38a169"} subtext="Expiring within 60 days" />
                <StatCard label="Unique Batches" value={stats.totalItems} color="#4a5568" subtext="Total inventory lines" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', marginBottom: '30px' }}>
                <div style={sectionStyle}>
                    <h3 style={sectionTitleStyle}>Top 5 Selling Medications (Volume)</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={10} tick={{ fill: '#718096' }} interval={0} />
                                <YAxis fontSize={12} tick={{ fill: '#718096' }} />
                                <Tooltip cursor={{ fill: '#f7fafc' }} />
                                <Bar dataKey="sales" fill="#4a5568" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={sectionStyle}>
                    <h3 style={sectionTitleStyle}>Inventory Composition</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Operations Quick Launch</h3>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <ActionButton to="/sell-stock" label="New Sale" icon="💳" />
                    <ActionButton to="/add-stock" label="Add Stock" icon="📥" />
                    <ActionButton to="/audit" label="Sales Logs" icon="📑" />
                    <ActionButton to="/alerts" label="Checklist" icon="✅" />
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, color, subtext }) {
    return (
        <div style={{ padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#a0aec0', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: color }}>{value}</div>
            <div style={{ fontSize: '11px', color: '#718096', marginTop: '4px' }}>{subtext}</div>
        </div>
    );
}

function ActionButton({ to, label, icon }) {
    return (
        <Link to={to} style={{
            textDecoration: 'none', padding: '15px 25px', background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: '10px', display: 'flex', alignItems: 'center',
            gap: '12px', color: '#2d3748', fontWeight: 'bold', transition: 'all 0.2s'
        }} onMouseOver={e => { e.currentTarget.style.background = '#edf2f7'; e.currentTarget.style.borderColor = '#cbd5e0'; }} onMouseOut={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}>
            <span style={{ fontSize: '20px' }}>{icon}</span>
            <span>{label}</span>
        </Link>
    );
}

const sectionStyle = { background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0' };
const sectionTitleStyle = { fontSize: '15px', marginBottom: '25px', color: '#4a5568', fontWeight: '600' };

// Updated to width: 100% to fill the column container
const refreshBtnStyle = {
    width: '100%',
    padding: '10px 16px',
    background: 'transparent',
    border: '1px solid #cbd5e0',
    borderRadius: '6px',
    color: '#718096',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    textAlign: 'center'
};

// Updated to width: 100% and text-align center
const alertsBtnStyle = {
    width: '100%',
    padding: '10px 16px',
    background: '#E53E3E',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '700',
    textDecoration: 'none',
    display: 'block',
    textAlign: 'center',
    boxSizing: 'border-box'
};