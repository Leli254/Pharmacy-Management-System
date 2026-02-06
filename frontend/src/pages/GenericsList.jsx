import React, { useState, useEffect } from "react";
import { apiGet, apiDelete } from "../api/api";
import { Link } from "react-router-dom";

export default function GenericsList() {
    const [generics, setGenerics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const isAdmin = localStorage.getItem("user_role") === "admin";

    const fetchGenerics = async () => {
        try {
            setLoading(true);
            const data = await apiGet("/stock/generics");
            setGenerics(data || []);
        } catch (err) {
            console.error("Failed to fetch generics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchGenerics(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will set any linked brands to 'No Generic'. This action cannot be undone.")) return;
        try {
            await apiDelete(`/stock/generics/${id}`);
            setGenerics(generics.filter(g => g.id !== id));
        } catch (err) {
            alert("Delete failed. Please check server logs.");
        }
    };

    // Robust Search: Filters by Name or Description
    const filteredItems = generics.filter(g =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.description && g.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Molecule Registry...</div>;

    return (
        <div style={{ maxWidth: "1000px", margin: "2rem auto", padding: "0 20px", fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Generic Molecules</h2>
                    <p style={{ margin: 0, color: '#718096', fontSize: '14px' }}>Active pharmaceutical ingredients catalog.</p>
                </div>
                <Link to="/add-generic" style={addBtnStyle}>+ Add New</Link>
            </div>

            <input
                type="text"
                placeholder="Search generics by name or description..."
                style={searchStyle}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />

            <div style={tableWrapperStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', background: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ padding: '12px' }}>ID</th>
                            <th style={{ padding: '12px' }}>Generic Name</th>
                            <th style={{ padding: '12px' }}>Description</th>
                            <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? currentItems.map(g => (
                            <tr key={g.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                                <td style={{ padding: '12px', color: '#718096' }}>#{g.id}</td>
                                <td style={{ padding: '12px', fontWeight: 'bold', color: '#2d3748' }}>{g.name}</td>
                                <td style={{ padding: '12px', color: '#4a5568', fontSize: '14px' }}>
                                    {g.description || <em style={{ color: '#cbd5e0' }}>No notes</em>}
                                </td>
                                <td style={{ padding: '12px', textAlign: 'right' }}>
                                    {isAdmin ? (
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                                            <Link to={`/edit-generic/${g.id}`} style={editBtnStyle}>Edit</Link>
                                            <button onClick={() => handleDelete(g.id)} style={deleteBtnStyle}>Delete</button>
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: '12px', color: '#a0aec0' }}>Protected</span>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#a0aec0' }}>
                                    No generic molecules found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={pageBtnStyle}>Prev</button>
                    <span style={{ alignSelf: 'center', fontSize: '14px' }}>Page {currentPage} of {totalPages}</span>
                    <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} style={pageBtnStyle}>Next</button>
                </div>
            )}
        </div>
    );
}

// Styles
const searchStyle = { width: '100%', padding: '14px', marginBottom: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', boxSizing: 'border-box' };
const tableWrapperStyle = { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const addBtnStyle = { textDecoration: 'none', background: '#38a169', color: 'white', padding: '10px 18px', borderRadius: '8px', fontWeight: 'bold' };
const editBtnStyle = { textDecoration: 'none', color: '#3182ce', fontSize: '14px', fontWeight: 'bold' };
const deleteBtnStyle = { background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', padding: 0 };
const pageBtnStyle = { padding: '6px 16px', borderRadius: '6px', border: '1px solid #cbd5e0', cursor: 'pointer', background: 'white', fontWeight: '600' };