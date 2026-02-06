import { useState, useEffect } from "react";
import { apiGet, apiPost } from "../api/api";
import { useNavigate } from "react-router-dom";

function AddBrand() {
    const [generics, setGenerics] = useState([]);
    const [selectedGenericId, setSelectedGenericId] = useState("");
    const [brandName, setBrandName] = useState("");
    const [reorderLevel, setReorderLevel] = useState(10); // Added Reorder Level state
    const [isControlled, setIsControlled] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [newGenericName, setNewGenericName] = useState("");
    const [modalLoading, setModalLoading] = useState(false);
    const navigate = useNavigate();

    const loadGenerics = async () => {
        try {
            const data = await apiGet("/stock/generics");
            setGenerics(data || []);
        } catch (err) { setError("Failed to load generics"); }
    };

    useEffect(() => { loadGenerics(); }, []);

    const handleAddGenericQuickly = async (e) => {
        e.preventDefault();
        if (!newGenericName.trim()) return;
        setModalLoading(true);
        try {
            const res = await apiPost("/stock/generics", { name: newGenericName.trim() });
            await loadGenerics();
            setSelectedGenericId(res.id);
            setShowModal(false);
            setNewGenericName("");
        } catch (err) { alert("Error adding generic"); }
        finally { setModalLoading(false); }
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setMessage(""); setError(""); setLoading(true);
        try {
            const data = {
                brand_name: brandName.trim(),
                generic_id: selectedGenericId ? Number(selectedGenericId) : null,
                is_controlled: isControlled,
                reorder_level: Number(reorderLevel) // Using dynamic reorder level
            };

            await apiPost("/stock/products", data);

            setMessage("Brand/Product added successfully!");
            setTimeout(() => navigate("/add-stock"), 1500);
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to add brand.");
        }
        finally { setLoading(false); }
    }

    return (
        <div className="container" style={{ maxWidth: '600px', margin: '2rem auto' }}>
            <h2 style={{ marginBottom: '24px' }}>Add New Brand (Product)</h2>
            {error && <div style={{ color: "#c53030", background: '#fff5f5', padding: '12px', marginBottom: '16px', borderRadius: '6px' }}>{error}</div>}
            {message && <div style={{ color: "#276749", background: '#f0fff4', padding: '12px', marginBottom: '16px', borderRadius: '6px' }}>{message}</div>}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Associated Generic</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <select
                            value={selectedGenericId}
                            onChange={(e) => setSelectedGenericId(e.target.value)}
                            style={{ flex: 1, padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                        >
                            <option value="">-- No Generic --</option>
                            {generics.map((g) => (<option key={g.id} value={g.id}>{g.name}</option>))}
                        </select>
                        <button
                            type="button"
                            onClick={() => setShowModal(true)}
                            style={{ padding: '0 15px', borderRadius: '6px', background: '#38a169', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                        >
                            + New
                        </button>
                    </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Brand Name *</label>
                    <input
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        required
                        placeholder="e.g. Panadol"
                        style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                    />
                </div>

                {/* NEW: Reorder Level Input */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Reorder Level (Alert Threshold)</label>
                    <input
                        type="number"
                        value={reorderLevel}
                        onChange={(e) => setReorderLevel(e.target.value)}
                        required
                        style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                    />
                </div>

                <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                        type="checkbox"
                        id="controlled"
                        checked={isControlled}
                        onChange={(e) => setIsControlled(e.target.checked)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <label htmlFor="controlled" style={{ fontWeight: '600', color: isControlled ? '#c53030' : '#4a5568', cursor: 'pointer' }}>
                        Controlled Substance (DDA)
                    </label>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{ flex: 1, padding: '12px', background: '#3182ce', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}
                    >
                        {loading ? "Processing..." : "Add Brand"}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/add-stock")}
                        style={{ padding: '12px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', width: '100px' }}
                    >
                        Cancel
                    </button>
                </div>
            </form>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ marginTop: 0 }}>Quick Add Generic</h3>
                        <p style={{ fontSize: '14px', color: '#718096' }}>Enter the generic chemical name (e.g. Paracetamol).</p>
                        <input
                            value={newGenericName}
                            onChange={(e) => setNewGenericName(e.target.value)}
                            placeholder="Generic Name"
                            style={{ width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '6px', border: '1px solid #cbd5e0' }}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={handleAddGenericQuickly}
                                disabled={modalLoading}
                                style={{ flex: 1, padding: '10px', background: '#38a169', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                {modalLoading ? "Saving..." : "Save"}
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ flex: 1, padding: '10px', background: '#edf2f7', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AddBrand;