import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost } from "../api/api";

function AddStock() {
    const [generics, setGenerics] = useState([]);
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    const [selectedProductId, setSelectedProductId] = useState("");
    const [selectedSupplierId, setSelectedSupplierId] = useState("");
    const [batchNumber, setBatchNumber] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [quantity, setQuantity] = useState("");
    const [buyingPrice, setBuyingPrice] = useState("");
    const [sellingPrice, setSellingPrice] = useState("");
    const [expiryAlertDays, setExpiryAlertDays] = useState(60);

    const [showGenericModal, setShowGenericModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);

    // Modal Form States
    const [newGeneric, setNewGeneric] = useState({ name: "", description: "" });
    const [newSupplier, setNewSupplier] = useState({ name: "", contact_person: "", phone: "", email: "" });
    const [newProductName, setNewProductName] = useState("");
    const [newReorderLevel, setNewReorderLevel] = useState(10);
    const [isControlled, setIsControlled] = useState(false);
    const [selectedGenericForProduct, setSelectedGenericForProduct] = useState("");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const fetchData = useCallback(async () => {
        try {
            const [genData, prodData, supData] = await Promise.all([
                apiGet("/stock/generics"),
                apiGet("/stock/products"),
                apiGet("/stock/suppliers")
            ]);
            setGenerics(genData || []);
            setProducts(prodData || []);
            setSuppliers(supData || []);
        } catch (err) {
            setError("Failed to sync dropdown data");
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleQuickAddGeneric = async (e) => {
        e.preventDefault();
        try {
            const res = await apiPost("/stock/generics", newGeneric);
            await fetchData();
            setSelectedGenericForProduct(res.id);
            setShowGenericModal(false);
            setNewGeneric({ name: "", description: "" });
        } catch (err) { alert(err.response?.data?.detail || "Error adding generic"); }
    };

    const handleQuickAddProduct = async (e) => {
        e.preventDefault();
        try {
            const res = await apiPost("/stock/products", {
                brand_name: newProductName,
                generic_id: selectedGenericForProduct ? Number(selectedGenericForProduct) : null,
                reorder_level: Number(newReorderLevel),
                is_controlled: isControlled
            });
            await fetchData();
            setSelectedProductId(res.id);
            setShowProductModal(false);
            setNewProductName("");
            setNewReorderLevel(10);
            setIsControlled(false);
            setSelectedGenericForProduct("");
        } catch (err) { alert(err.response?.data?.detail || "Error adding product"); }
    };

    const handleQuickAddSupplier = async (e) => {
        e.preventDefault();
        try {
            const res = await apiPost("/stock/suppliers", newSupplier);
            await fetchData();
            setSelectedSupplierId(res.id);
            setShowSupplierModal(false);
            setNewSupplier({ name: "", contact_person: "", phone: "", email: "" });
        } catch (err) { alert(err.response?.data?.detail || "Error adding supplier"); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(""); setError("");
        try {
            await apiPost("/stock/", {
                product_id: Number(selectedProductId),
                supplier_id: selectedSupplierId ? Number(selectedSupplierId) : null,
                batch_number: batchNumber,
                expiry_date: expiryDate,
                quantity: Number(quantity),
                buying_price: Number(buyingPrice),
                unit_price: Number(sellingPrice),
                expiry_alert_days: Number(expiryAlertDays)
            });
            setMessage("Stock batch saved successfully!");
            setBatchNumber(""); setQuantity(""); setBuyingPrice(""); setSellingPrice("");
        } catch (err) { setError(err.response?.data?.detail || "Failed to save stock batch"); }
    };

    return (
        <div className="container" style={{ maxWidth: '800px', padding: '20px', fontFamily: 'sans-serif' }}>
            <h2 style={{ borderBottom: '4px solid #16a34a', paddingBottom: '10px', color: '#064e3b' }}>
                Add | Receive New Stock Batch
            </h2>

            {error && <div style={errorBannerStyle}>{error}</div>}
            {message && <div style={successBannerStyle}>{message}</div>}

            <div style={{ display: 'flex', gap: '12px', marginBottom: '25px', flexWrap: 'wrap' }}>
                <button onClick={() => setShowGenericModal(true)} style={topBtnStyle}>+ New Generic</button>
                <button onClick={() => setShowProductModal(true)} style={topBtnStyle}>+ New Brand/Product</button>
                <button onClick={() => setShowSupplierModal(true)} style={topBtnStyle}>+ New Supplier</button>
            </div>

            <form onSubmit={handleSubmit} style={formContainerStyle}>
                <div className="form-group">
                    <label style={labelBold}>Select Product (Brand Name)</label>
                    <select style={inputStyle} value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} required>
                        <option value="">-- Choose Brand --</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.brand_name}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label style={labelBold}>Supplier</label>
                    <select style={inputStyle} value={selectedSupplierId} onChange={(e) => setSelectedSupplierId(e.target.value)}>
                        <option value="">-- No Supplier --</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <label style={labelBold}>Batch Number</label>
                        <input placeholder="BATCH123" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} required style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelBold}>Expiry Date</label>
                        <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required style={inputStyle} />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px' }}>
                    <div>
                        <label style={labelBold}>Quantity</label>
                        <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelBold}>Cost Price</label>
                        <input type="number" step="0.01" value={buyingPrice} onChange={(e) => setBuyingPrice(e.target.value)} required style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelBold}>Selling Price</label>
                        <input type="number" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} required style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelBold}>Expiry Alert Days</label>
                        <input type="number" value={expiryAlertDays} onChange={(e) => setExpiryAlertDays(e.target.value)} required style={inputStyle} />
                    </div>
                </div>

                <button type="submit" style={mainSubmitBtnStyle}>Add Batch to Stock</button>
            </form>

            {/* Generic Modal */}
            {showGenericModal && (
                <div className="modal-overlay" style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ color: '#064e3b', marginTop: 0 }}>Add Generic Molecule</h3>
                        <label style={labelSmall}>Generic Name</label>
                        <input autoFocus value={newGeneric.name} onChange={(e) => setNewGeneric({ ...newGeneric, name: e.target.value })} style={modalInputStyle} placeholder="e.g. Paracetamol" />
                        <label style={labelSmall}>Description</label>
                        <textarea value={newGeneric.description} onChange={(e) => setNewGeneric({ ...newGeneric, description: e.target.value })} style={{ ...modalInputStyle, height: '80px' }} placeholder="Therapeutic class, notes, etc." />
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowGenericModal(false)} style={cancelBtnStyle}>Cancel</button>
                            <button onClick={handleQuickAddGeneric} style={saveBtnStyle}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Modal */}
            {showProductModal && (
                <div className="modal-overlay" style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ color: '#064e3b', marginTop: 0 }}>Register New Product</h3>
                        <label style={labelSmall}>Brand Name</label>
                        <input autoFocus value={newProductName} onChange={(e) => setNewProductName(e.target.value)} style={modalInputStyle} placeholder="e.g. Panadol" />
                        <label style={labelSmall}>Reorder Level (Alert threshold)</label>
                        <input type="number" value={newReorderLevel} onChange={(e) => setNewReorderLevel(e.target.value)} style={modalInputStyle} placeholder="10" />
                        <label style={labelSmall}>Link to Generic (Optional)</label>
                        <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                            <select value={selectedGenericForProduct} onChange={(e) => setSelectedGenericForProduct(e.target.value)} style={{ flex: 1, padding: '10px' }}>
                                <option value="">-- No Generic --</option>
                                {generics.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                            <button type="button" onClick={() => setShowGenericModal(true)} style={smallPlusBtn}>+</button>
                        </div>
                        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input type="checkbox" id="controlled-stock" checked={isControlled} onChange={(e) => setIsControlled(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                            <label htmlFor="controlled-stock" style={{ fontWeight: 'bold', color: isControlled ? '#dc2626' : '#166534', cursor: 'pointer', fontSize: '14px' }}>Controlled Substance (DDA)</label>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowProductModal(false)} style={cancelBtnStyle}>Cancel</button>
                            <button onClick={handleQuickAddProduct} style={saveBtnStyle}>Save Product</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Supplier Modal */}
            {showSupplierModal && (
                <div className="modal-overlay" style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3 style={{ color: '#064e3b', marginTop: 0 }}>Add New Supplier</h3>
                        <label style={labelSmall}>Supplier/Company Name</label>
                        <input autoFocus value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} style={modalInputStyle} />
                        <label style={labelSmall}>Contact Person</label>
                        <input value={newSupplier.contact_person} onChange={(e) => setNewSupplier({ ...newSupplier, contact_person: e.target.value })} style={modalInputStyle} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                                <label style={labelSmall}>Phone</label>
                                <input value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} style={modalInputStyle} />
                            </div>
                            <div>
                                <label style={labelSmall}>Email</label>
                                <input value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} style={modalInputStyle} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowSupplierModal(false)} style={cancelBtnStyle}>Cancel</button>
                            <button onClick={handleQuickAddSupplier} style={saveBtnStyle}>Save Supplier</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Keeping your existing styles exactly as they were
const formContainerStyle = { display: 'grid', gap: '20px', background: '#f0fdf4', padding: '25px', borderRadius: '12px', border: '1px solid #bbf7d0' };
const labelBold = { display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#064e3b' };
const labelSmall = { display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#166534' };
const inputStyle = { width: '100%', padding: '12px', border: '2px solid #bbf7d0', borderRadius: '8px', boxSizing: 'border-box', outline: 'none' };
const topBtnStyle = { padding: '10px 18px', background: '#16a34a', border: 'none', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' };
const mainSubmitBtnStyle = { padding: '16px', background: '#059669', color: '#ffffff', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px' };
const saveBtnStyle = { background: '#16a34a', border: 'none', padding: '10px 25px', color: '#ffffff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const cancelBtnStyle = { background: '#dc2626', border: 'none', padding: '10px 25px', color: '#ffffff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const smallPlusBtn = { padding: '0 15px', background: '#059669', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContentStyle = { background: 'white', padding: '30px', borderRadius: '15px', minWidth: '450px', border: '4px solid #16a34a' };
const modalInputStyle = { width: '100%', padding: '12px', marginBottom: '15px', border: '2px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' };
const errorBannerStyle = { color: "#991b1b", padding: '12px', background: '#fee2e2', borderRadius: '8px', margin: '15px 0', border: '1px solid #f87171', fontWeight: 'bold' };
const successBannerStyle = { color: "#065f46", padding: '12px', background: '#d1fae5', borderRadius: '8px', margin: '15px 0', border: '1px solid #34d399', fontWeight: 'bold' };

export default AddStock;