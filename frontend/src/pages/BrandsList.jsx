import React, { useState, useEffect } from "react";
import { apiGet, apiDelete } from "../api/api";
import { Link } from "react-router-dom";

export default function BrandsList() {
    const [brands, setBrands] = useState([]);
    const [generics, setGenerics] = useState([]); // Store generics for mapping
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const isAdmin = localStorage.getItem("user_role") === "admin";

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch both products and generics simultaneously
            const [productsData, genericsData] = await Promise.all([
                apiGet("/stock/products"),
                apiGet("/stock/generics")
            ]);
            setBrands(productsData || []);
            setGenerics(genericsData || []);
        } catch (err) {
            console.error("Failed to fetch registry data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Helper function to find generic name by ID
    const getGenericName = (genericId) => {
        if (!genericId) return null;
        const match = generics.find(g => g.id === genericId);
        return match ? match.name : null;
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This removes the brand definition. Batches will remain as 'Unbranded'.")) return;
        try {
            await apiDelete(`/stock/products/${id}`);
            setBrands(brands.filter(b => b.id !== id));
        } catch (err) {
            alert("Delete failed.");
        }
    };

    // Filter by Brand Name or the Mapped Generic Name
    const filteredItems = brands.filter(b => {
        const genName = getGenericName(b.generic_id) || "";
        return b.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            genName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Syncing Registries...</div>;

    return (
        <div style={{ maxWidth: "1100px", margin: "2rem auto", padding: "0 20px", fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#2d3748' }}>Brand & Product Registry</h2>
                    <p style={{ margin: 0, color: '#718096', fontSize: '14px' }}>Managing medication brand mapping and reorder levels.</p>
                </div>
                <Link to="/add-brand" style={addBtnStyle}>+ Register Brand</Link>
            </div>

            <input
                type="text"
                placeholder="Search by Brand or Generic molecule..."
                style={searchStyle}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />

            <div style={tableWrapperStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={thStyle}>Brand Name</th>
                            <th style={thStyle}>Generic Molecule</th>
                            <th style={thStyle}>Min. Level</th>
                            <th style={thStyle}>Type</th>
                            <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map(b => {
                            const genName = getGenericName(b.generic_id);
                            return (
                                <tr key={b.id} style={trStyle}>
                                    <td style={{ padding: '14px', fontWeight: 'bold', color: '#2d3748' }}>{b.brand_name}</td>
                                    <td style={{ padding: '14px', color: '#4a5568' }}>
                                        {genName ? (
                                            <span style={{ background: '#ebf8ff', color: '#2b6cb0', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>
                                                {genName}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#a0aec0', fontSize: '13px', fontStyle: 'italic' }}>
                                                ⚠️ No Generic Linked
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '14px' }}>
                                        <span style={badgeStyle}>{b.reorder_level} units</span>
                                    </td>
                                    <td style={{ padding: '14px' }}>
                                        {b.is_controlled ? (
                                            <span style={ddaBadgeStyle}>DDA</span>
                                        ) : (
                                            <span style={regBadgeStyle}>Regular</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '14px', textAlign: 'right' }}>
                                        {isAdmin ? (
                                            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                                                <Link to={`/edit-brand/${b.id}`} style={editBtnStyle}>Edit</Link>
                                                <button onClick={() => handleDelete(b.id)} style={deleteBtnStyle}>Delete</button>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '12px', color: '#a0aec0' }}>Protected</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div style={{ marginTop: '25px', display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={pageBtnStyle}>Previous</button>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>{currentPage} / {totalPages}</span>
                    <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} style={pageBtnStyle}>Next</button>
                </div>
            )}
        </div>
    );
}

// Styles (unchanged from previous version)
const thStyle = { padding: '12px', fontSize: '13px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' };
const trStyle = { borderBottom: '1px solid #edf2f7', transition: 'background 0.2s' };
const searchStyle = { width: '100%', padding: '14px', marginBottom: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '16px' };
const tableWrapperStyle = { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
const addBtnStyle = { textDecoration: 'none', background: '#059669', color: 'white', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' };
const editBtnStyle = { textDecoration: 'none', color: '#2563eb', fontSize: '14px', fontWeight: 'bold' };
const deleteBtnStyle = { background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', padding: 0 };
const pageBtnStyle = { padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', cursor: 'pointer', background: 'white', fontWeight: '600' };
const badgeStyle = { background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' };
const ddaBadgeStyle = { background: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', border: '1px solid #fecaca' };
const regBadgeStyle = { background: '#f0fdf4', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', border: '1px solid #bbf7d0' };