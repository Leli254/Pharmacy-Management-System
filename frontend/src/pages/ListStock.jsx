import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../api/api";

function ListStock() {
    const [groupedStocks, setGroupedStocks] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedBrands, setExpandedBrands] = useState({});

    const fetchStock = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await apiGet("/stock/");
            const today = new Date();

            const activeItems = data.filter(d =>
                !d.batch_number.startsWith("PLACEHOLDER-") &&
                new Date(d.expiry_date) >= today
            );

            const groups = activeItems.reduce((acc, item) => {
                const brand = item.brand_name;
                if (!acc[brand]) {
                    acc[brand] = {
                        brand_name: brand,
                        total_quantity: 0,
                        is_controlled: false,
                        max_reorder_level: 0,
                        batches: []
                    };
                }
                acc[brand].total_quantity += item.quantity;
                acc[brand].batches.push(item);
                if (item.reorder_level > acc[brand].max_reorder_level) {
                    acc[brand].max_reorder_level = item.reorder_level;
                }
                if (item.is_controlled) acc[brand].is_controlled = true;
                return acc;
            }, {});

            setGroupedStocks(groups);
        } catch (err) {
            setError("Failed to load stock list.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStock(); }, [refreshKey]);

    const toggleExpand = (brand) => {
        setExpandedBrands(prev => ({ ...prev, [brand]: !prev[brand] }));
    };

    const filteredBrandNames = Object.keys(groupedStocks).filter(name =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort();

    return (
        <div style={{ maxWidth: "1300px", margin: "2rem auto", padding: "1.5rem", fontFamily: 'sans-serif' }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                    <h2 style={{ margin: 0 }}>Pharmacy Inventory</h2>
                    <p style={{ color: '#718096', fontSize: '14px' }}>Real-time Stock Levels • Kenya Shillings (KES)</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {/* Updated Navigation Links */}
                    <Link to="/manage/generics" style={secondaryLinkStyle}>Generics</Link>
                    <Link to="/manage/brands" style={secondaryLinkStyle}>Branded Drugs</Link>
                    <Link to="/manage/suppliers" style={secondaryLinkStyle}>Suppliers</Link>
                    <Link to="/add-stock" style={secondaryLinkStyle}>Add Stock</Link>

                    {/* Existing Controls */}
                    <Link
                        to="/sell-stock"
                        style={{
                            textDecoration: 'none',
                            padding: '10px 20px',
                            background: '#38a169',
                            color: 'white',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            display: 'inline-block'
                        }}
                    >
                        + New Sale
                    </Link>
                    <button
                        onClick={() => setRefreshKey(k => k + 1)}
                        style={{ padding: '10px 20px', background: '#3182ce', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        {loading ? "Syncing..." : "Sync Stock"}
                    </button>
                </div>
            </div>

            <input
                type="text"
                placeholder="Search by brand name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%", padding: "14px", marginBottom: "20px", borderRadius: "10px", border: "1px solid #cbd5e0", fontSize: '16px' }}
            />

            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

            <div style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
                    <thead style={{ background: "#edf2f7" }}>
                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ padding: "16px 24px" }}>Brand & Batch</th>
                            <th style={{ padding: "16px" }}>Unit Price</th>
                            <th style={{ padding: "16px" }}>Total Quantity</th>
                            <th style={{ padding: "16px" }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredBrandNames.length > 0 ? (
                            filteredBrandNames.map(brandName => {
                                const group = groupedStocks[brandName];
                                const isExpanded = expandedBrands[brandName];
                                const isLowStock = group.total_quantity <= group.max_reorder_level;

                                return (
                                    <React.Fragment key={brandName}>
                                        <tr
                                            onClick={() => toggleExpand(brandName)}
                                            style={{ borderTop: "1px solid #e2e8f0", cursor: 'pointer', background: isExpanded ? '#f7fafc' : 'white' }}
                                        >
                                            <td style={{ padding: "18px 24px", fontWeight: "700", color: '#2d3748' }}>
                                                <span style={{ marginRight: '12px', color: '#a0aec0' }}>{isExpanded ? "▼" : "▶"}</span>
                                                {brandName}
                                                {group.is_controlled && <span style={{ marginLeft: '10px', background: '#fed7d7', color: '#9b2c2c', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' }}>DDA</span>}
                                            </td>
                                            <td style={{ padding: "18px", color: '#718096', fontSize: '13px' }}>
                                                Mixed Batches
                                            </td>
                                            <td style={{ padding: "18px", fontWeight: '600' }}>
                                                {group.total_quantity} units
                                                {isLowStock && <span style={{ marginLeft: '8px', color: '#dd6b20', fontSize: '10px', background: '#fffaf0', border: '1px solid #fbd38d', padding: '2px 4px', borderRadius: '3px' }}>LOW</span>}
                                            </td>
                                            <td style={{ padding: "18px", fontSize: '13px', color: '#a0aec0' }}>{group.batches.length} active batches</td>
                                        </tr>

                                        {isExpanded && group.batches.map(batch => (
                                            <tr key={batch.id} style={{ background: "#ffffff", borderBottom: '1px solid #edf2f7' }}>
                                                <td style={{ padding: "12px 12px 12px 60px", fontSize: '14px', color: '#4a5568' }}>
                                                    Batch: {batch.batch_number} <br />
                                                    <small style={{ color: '#a0aec0' }}>Expires: {batch.expiry_date}</small>
                                                </td>
                                                <td style={{ padding: "12px", fontSize: '14px', fontWeight: 'bold' }}>
                                                    KES {batch.unit_price.toLocaleString()}
                                                </td>
                                                <td style={{ padding: "12px", fontSize: '14px' }}>{batch.quantity} available</td>
                                                <td style={{ padding: "12px" }}>
                                                    {batch.quantity > 0 ? (
                                                        <span style={{ color: '#38a169', fontSize: '12px', fontWeight: 'bold' }}>IN STOCK</span>
                                                    ) : (
                                                        <span style={{ color: '#e53e3e', fontSize: '12px', fontWeight: 'bold' }}>OUT OF STOCK</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                )
                            })
                        ) : (
                            <tr>
                                <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#a0aec0' }}>
                                    {loading ? "Loading stock..." : "No items found."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const secondaryLinkStyle = {
    textDecoration: 'none',
    padding: '10px 15px',
    background: '#edf2f7',
    color: '#4a5568',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '14px',
    border: '1px solid #cbd5e0',
    display: 'inline-flex',
    alignItems: 'center'
};

export default ListStock;