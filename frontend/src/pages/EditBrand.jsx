import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPut } from "../api/api";

export default function EditBrand() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Form State
    const [brandName, setBrandName] = useState("");
    const [selectedGenericId, setSelectedGenericId] = useState("");
    const [reorderLevel, setReorderLevel] = useState(10);
    const [isControlled, setIsControlled] = useState(false);

    // Data State
    const [generics, setGenerics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // Fetch the specific brand and the full list of generics
                const [brandData, genericsData] = await Promise.all([
                    apiGet(`/stock/products/${id}`),
                    apiGet("/stock/generics")
                ]);

                setBrandName(brandData.brand_name);
                setSelectedGenericId(brandData.generic_id || "");
                setReorderLevel(brandData.reorder_level);
                setIsControlled(brandData.is_controlled);
                setGenerics(genericsData || []);
            } catch (err) {
                setError("Could not load brand details. It may have been deleted.");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            const payload = {
                brand_name: brandName,
                generic_id: selectedGenericId ? Number(selectedGenericId) : null,
                reorder_level: Number(reorderLevel),
                is_controlled: isControlled
            };

            await apiPut(`/stock/products/${id}`, payload);
            navigate("/manage/brands"); // Redirect back to list
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to update brand.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading Brand Details...</div>;

    return (
        <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '20px', fontFamily: 'sans-serif' }}>
            <h2 style={{ borderBottom: '3px solid #3182ce', paddingBottom: '10px', color: '#2c5282' }}>
                Edit Brand: {brandName}
            </h2>

            {error && <div style={errorStyle}>{error}</div>}

            <form onSubmit={handleSave} style={formStyle}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={labelStyle}>Brand Name</label>
                    <input
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        required
                        style={inputStyle}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={labelStyle}>Associated Generic Molecule</label>
                    <select
                        value={selectedGenericId}
                        onChange={(e) => setSelectedGenericId(e.target.value)}
                        style={inputStyle}
                    >
                        <option value="">-- No Generic (Unlinked) --</option>
                        {generics.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={labelStyle}>Reorder Level (Safety Stock)</label>
                    <input
                        type="number"
                        value={reorderLevel}
                        onChange={(e) => setReorderLevel(e.target.value)}
                        required
                        style={inputStyle}
                    />
                </div>

                <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                        type="checkbox"
                        id="is_controlled"
                        checked={isControlled}
                        onChange={(e) => setIsControlled(e.target.checked)}
                        style={{ width: '20px', height: '20px' }}
                    />
                    <label htmlFor="is_controlled" style={{ fontWeight: 'bold', color: isControlled ? '#c53030' : '#4a5568' }}>
                        Controlled Substance (DDA)
                    </label>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" disabled={saving} style={saveBtnStyle}>
                        {saving ? "Saving Changes..." : "Update Brand"}
                    </button>
                    <button type="button" onClick={() => navigate("/manage/brands")} style={cancelBtnStyle}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

// Styling
const formStyle = { background: '#f7fafc', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0' };
const labelStyle = { display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#4a5568' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' };
const saveBtnStyle = { flex: 1, padding: '14px', background: '#3182ce', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const cancelBtnStyle = { padding: '14px', background: '#edf2f7', color: '#4a5568', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const errorStyle = { background: '#fff5f5', color: '#c53030', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #feb2b2', fontWeight: 'bold' };