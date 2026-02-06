import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPut } from "../api/api";

export default function EditSupplier() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        contact_person: ""
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        apiGet(`/stock/suppliers/${id}`)
            .then(data => {
                // Ensuring null values from DB don't cause controlled component warnings
                setFormData({
                    name: data.name || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    contact_person: data.contact_person || ""
                });
                setLoading(false);
            })
            .catch(() => {
                setError("Supplier not found");
                setLoading(false);
            });
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // We use the SupplierCreate schema logic (name, contact_person, phone, email)
            await apiPut(`/stock/suppliers/${id}`, formData);
            navigate("/manage/suppliers");
        } catch (err) {
            setError("Update failed. Please check your connection or data format.");
        }
    };

    if (loading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</p>;

    return (
        <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '20px', fontFamily: 'sans-serif' }}>
            <h2 style={{ color: '#2c5282', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
                Edit Supplier Details
            </h2>

            {error && <div style={errorBanner}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px', background: '#fff', padding: '20px', borderRadius: '8px' }}>
                <div>
                    <label style={labelStyle}>Company Name</label>
                    <input
                        style={inputStyle}
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </div>

                <div>
                    <label style={labelStyle}>Contact Person</label>
                    <input
                        style={inputStyle}
                        value={formData.contact_person}
                        onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                        placeholder="Name of the representative"
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                        <label style={labelStyle}>Phone</label>
                        <input
                            style={inputStyle}
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Email</label>
                        <input
                            style={inputStyle}
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button type="submit" style={saveBtn}>Save Changes</button>
                    <button
                        type="button"
                        onClick={() => navigate("/manage/suppliers")}
                        style={cancelBtn}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

const labelStyle = { fontWeight: 'bold', color: '#4a5568', fontSize: '14px' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', marginTop: '5px', boxSizing: 'border-box' };
const errorBanner = { padding: '10px', background: '#fff5f5', color: '#c53030', borderRadius: '6px', marginBottom: '15px', border: '1px solid #feb2b2', fontSize: '14px' };

const saveBtn = { flex: 2, padding: '12px', background: '#3182ce', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const cancelBtn = { flex: 1, padding: '12px', background: '#E53E3E', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' };