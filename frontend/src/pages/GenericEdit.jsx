import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPut } from "../api/api";

export default function EditGeneric() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchGeneric = async () => {
            try {
                setLoading(true);
                const data = await apiGet(`/stock/generics/${id}`);
                setName(data.name);
                setDescription(data.description || "");
            } catch (err) {
                setError("Generic molecule not found or server error.");
            } finally {
                setLoading(false);
            }
        };
        fetchGeneric();
    }, [id]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await apiPut(`/stock/generics/${id}`, {
                name: name.trim(),
                description: description.trim()
            });
            navigate("/manage/generics");
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to update generic molecule.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={msgStyle}>Loading Molecule Data...</div>;

    return (
        <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '20px' }}>
            <h2 style={{ color: '#2c7a7b' }}>Edit Generic Molecule</h2>

            {error && <div style={errorBanner}>{error}</div>}

            <form onSubmit={handleUpdate} style={formBox}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={labelStyle}>Chemical / Generic Name</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={inputStyle}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={labelStyle}>Description (Optional)</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={{ ...inputStyle, height: '100px', resize: 'vertical' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" disabled={saving} style={saveBtn}>
                        {saving ? "Saving..." : "Update Generic"}
                    </button>
                    <button type="button" onClick={() => navigate("/manage/generics")} style={cancelBtn}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

const formBox = { background: '#f0fff4', padding: '25px', borderRadius: '12px', border: '1px solid #c6f6d5' };
const labelStyle = { display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#276749' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' };
const saveBtn = { flex: 2, padding: '12px', background: '#38a169', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' };
const cancelBtn = { flex: 1, padding: '12px', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '6px', cursor: 'pointer' };
const errorBanner = { padding: '10px', background: '#fff5f5', color: '#c53030', borderRadius: '6px', marginBottom: '15px', border: '1px solid #feb2b2' };
const msgStyle = { textAlign: 'center', marginTop: '50px', fontSize: '18px', color: '#718096' };