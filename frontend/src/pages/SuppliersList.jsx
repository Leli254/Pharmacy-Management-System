import React, { useState, useEffect } from "react";
import { apiGet, apiDelete } from "../api/api";
import { Link, useNavigate } from "react-router-dom";

export default function SuppliersList() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    const isAdmin = localStorage.getItem("user_role") === "admin";

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const data = await apiGet("/stock/suppliers");
            setSuppliers(data || []);
        } catch (err) {
            console.error("Failed to fetch suppliers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSuppliers(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this supplier? Historic batch records will be kept but marked 'No Supplier'.")) return;
        try {
            await apiDelete(`/stock/suppliers/${id}`);
            setSuppliers(suppliers.filter(s => s.id !== id));
        } catch (err) {
            alert("Delete failed.");
        }
    };

    const filtered = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.contact_person && s.contact_person.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Suppliers...</div>;

    return (
        <div style={{ maxWidth: "1000px", margin: "2rem auto", padding: "0 20px", fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ color: '#2d3748' }}>Suppliers Registry</h2>
                <button
                    onClick={() => navigate("/add-supplier")}
                    style={addBtnStyle}
                >
                    + Add Supplier
                </button>
            </div>

            <input
                type="text"
                placeholder="Search by company or contact person..."
                style={searchStyle}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div style={tableWrapperStyle}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', background: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ padding: '15px' }}>Supplier / Company</th>
                            <th style={{ padding: '15px' }}>Contact Person</th>
                            <th style={{ padding: '15px' }}>Phone & Email</th>
                            <th style={{ padding: '15px', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length > 0 ? filtered.map(s => (
                            <tr key={s.id} style={{ borderBottom: '1px solid #edf2f7', transition: 'background 0.2s' }} className="hover-row">
                                <td style={{ padding: '15px', fontWeight: 'bold', color: '#2d3748' }}>{s.name}</td>
                                <td style={{ padding: '15px', color: '#4a5568' }}>
                                    {s.contact_person || <span style={{ color: '#cbd5e0', fontStyle: 'italic' }}>Not specified</span>}
                                </td>
                                <td style={{ padding: '15px', fontSize: '13px', color: '#4a5568', lineHeight: '1.4' }}>
                                    <div style={{ fontWeight: '500' }}>{s.phone || "No Phone"}</div>
                                    <div style={{ color: '#718096' }}>{s.email || "No Email"}</div>
                                </td>
                                <td style={{ padding: '15px', textAlign: 'right' }}>
                                    {isAdmin && (
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                                            <Link
                                                to={`/edit-supplier/${s.id}`}
                                                style={{ color: '#3182ce', fontWeight: 'bold', textDecoration: 'none', fontSize: '14px' }}
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(s.id)}
                                                style={{ color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', padding: 0 }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: '#a0aec0' }}>
                                    No suppliers found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const searchStyle = { width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' };
const tableWrapperStyle = { background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' };
const addBtnStyle = { background: '#38a169', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' };