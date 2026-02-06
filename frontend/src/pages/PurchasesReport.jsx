import React, { useState, useEffect, useCallback } from "react";
import { apiGet } from "../api/api";

const PurchasesReport = () => {
    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [stockData, supplierData] = await Promise.all([
                apiGet("/stock/"),
                apiGet("/stock/suppliers")
            ]);
            setPurchases(stockData || []);
            setSuppliers(supplierData || []);
        } catch (err) {
            setError("Failed to load purchase records.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Helper to get Supplier Name by ID
    const getSupplierName = (id) => {
        const sup = suppliers.find(s => s.id === id);
        return sup ? sup.name : "Unknown / Deleted";
    };

    // Calculations
    const totalCostValue = purchases.reduce((acc, item) => acc + (item.buying_price * item.quantity), 0);
    const totalItems = purchases.reduce((acc, item) => acc + item.quantity, 0);

    if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>Loading financial data...</div>;

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                <div>
                    <h2 style={{ margin: 0, color: "#1e293b" }}>Purchases & Supplier Report</h2>
                    <p style={{ color: "#64748b", margin: "5px 0" }}>Financial overview of inventory acquisition</p>
                </div>
                <button
                    onClick={() => window.print()}
                    style={{ padding: "10px 20px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "6px", cursor: "pointer" }}
                >
                    Print Report
                </button>
            </header>

            {error && <div style={{ color: "red", marginBottom: "20px" }}>{error}</div>}

            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "40px" }}>
                <div style={cardStyle}>
                    <span style={labelStyle}>Total Inventory Valuation (Cost)</span>
                    <h2 style={{ color: "#2563eb", margin: "10px 0" }}>KES {totalCostValue.toLocaleString()}</h2>
                </div>
                <div style={cardStyle}>
                    <span style={labelStyle}>Total Units in Stock</span>
                    <h2 style={{ color: "#0f172a", margin: "10px 0" }}>{totalItems.toLocaleString()} Units</h2>
                </div>
                <div style={cardStyle}>
                    <span style={labelStyle}>Active Suppliers</span>
                    <h2 style={{ color: "#0f172a", margin: "10px 0" }}>{suppliers.length}</h2>
                </div>
            </div>

            {/* Detailed Table */}
            <div style={{ background: "white", borderRadius: "8px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ background: "#f8fafc" }}>
                        <tr>
                            <th style={thStyle}>Brand Name</th>
                            <th style={thStyle}>Batch No.</th>
                            <th style={thStyle}>Supplier</th>
                            <th style={thStyle}>Expiry</th>
                            <th style={thStyle}>Qty</th>
                            <th style={thStyle}>Unit Cost</th>
                            <th style={thStyle}>Total Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchases.map((item) => (
                            <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                <td style={tdStyle}><strong>{item.brand_name}</strong></td>
                                <td style={tdStyle}>{item.batch_number}</td>
                                <td style={tdStyle}>{getSupplierName(item.supplier_id)}</td>
                                <td style={tdStyle}>{item.expiry_date}</td>
                                <td style={tdStyle}>{item.quantity}</td>
                                <td style={tdStyle}>{item.buying_price.toFixed(2)}</td>
                                <td style={tdStyle}>{(item.buying_price * item.quantity).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {purchases.length === 0 && (
                    <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                        No purchase records found.
                    </div>
                )}
            </div>
        </div>
    );
};

// Internal Styles
const cardStyle = { padding: "20px", background: "white", borderRadius: "10px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" };
const labelStyle = { fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: "600" };
const thStyle = { textAlign: "left", padding: "12px 15px", color: "#475569", fontSize: "13px", borderBottom: "2px solid #e2e8f0" };
const tdStyle = { padding: "12px 15px", fontSize: "14px", color: "#1e293b" };

export default PurchasesReport;