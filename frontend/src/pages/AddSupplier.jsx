import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../api/api";

export default function AddSupplier() {
    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        contact_person: "",
        phone: "",
        email: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await apiPost("/stock/suppliers", formData);
            setSuccess(true);
            setTimeout(() => navigate("/manage/suppliers"), 1500);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to add supplier. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '20px', fontFamily: 'sans-serif' }}>
            <h2 style={{ color: '#2c5282', borderBottom: '2px solid #3182ce', paddingBottom: '10px' }}>
                Register New Supplier
            </h2>

            {error && <div style={errorStyle}>{error}</div>}
            {success && <div style={successStyle}>Supplier added successfully! Redirecting...</div>}

            <form onSubmit={handleSubmit} style={formBoxStyle}>
                <div style={fieldGroup}>
                    <label style={labelStyle}>Company / Supplier Name *</label>
                    <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g., PharmaDist Ltd"
                        style={inputStyle}
                    />
                </div>

                <div style={fieldGroup}>
                    <label style={labelStyle}>Contact Person</label>
                    <input
                        name="contact_person"
                        value={formData.contact_person}
                        onChange={handleChange}
                        placeholder="Full name of representative"
                        style={inputStyle}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div style={fieldGroup}>
                        <label style={labelStyle}>Phone Number</label>
                        <input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+254..."
                            style={inputStyle}
                        />
                    </div>
                    <div style={fieldGroup}>
                        <label style={labelStyle}>Email Address</label>
                        <input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="sales@supplier.com"
                            style={inputStyle}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button type="submit" disabled={loading} style={saveBtnStyle}>
                        {loading ? "Saving..." : "Save Supplier"}
                    </button>
                    <button type="button" onClick={() => navigate("/manage/suppliers")} style={cancelBtnStyle}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

// Styling Constants
const formBoxStyle = { background: '#f8fafc', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' };
const fieldGroup = { marginBottom: '18px' };
const labelStyle = { display: 'block', fontWeight: 'bold', marginBottom: '6px', color: '#4a5568', fontSize: '14px' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box', fontSize: '16px' };
const saveBtnStyle = { flex: 2, padding: '14px', background: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
// UPDATED: Changed background to #E53E3E and color to white
const cancelBtnStyle = { flex: 1, padding: '14px', background: '#E53E3E', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const errorStyle = { padding: '15px', background: '#fff5f5', color: '#c53030', borderRadius: '8px', marginBottom: '20px', border: '1px solid #feb2b2' };
const successStyle = { padding: '15px', background: '#f0fff4', color: '#276749', borderRadius: '8px', marginBottom: '20px', border: '1px solid #c6f6d5' };