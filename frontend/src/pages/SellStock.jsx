import React, { useState, useEffect, useMemo } from "react";
import { apiGet, apiPost } from "../api/api";

function SellStock() {
    const [inventory, setInventory] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [cart, setCart] = useState([]);
    const [clientName, setClientName] = useState("");
    const [loading, setLoading] = useState(false);

    // --- New Clinical States ---
    const [showPrescription, setShowPrescription] = useState(false);
    const [patientAge, setPatientAge] = useState("");
    const [patientSex, setPatientSex] = useState("");
    const [prescriberName, setPrescriberName] = useState("");
    const [medicalInstitution, setMedicalInstitution] = useState("");
    const [dosageInstructions, setDosageInstructions] = useState("");

    const [expandedProduct, setExpandedProduct] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const data = await apiGet("/stock/");
            setInventory(data.filter(d => d.quantity > 0));
        } catch (err) {
            console.error("Failed to load inventory:", err);
        }
    };

    // Check if any DDA items are in cart to prompt clinical details
    const hasDDAItems = useMemo(() => cart.some(item => item.is_controlled), [cart]);

    const groupedInventory = useMemo(() => {
        const groups = {};
        inventory.forEach(item => {
            if (!groups[item.brand_name]) {
                groups[item.brand_name] = {
                    brand_name: item.brand_name,
                    is_controlled: item.is_controlled,
                    total_stock: 0,
                    batches: []
                };
            }
            groups[item.brand_name].total_stock += item.quantity;
            groups[item.brand_name].batches.push(item);
        });

        return Object.values(groups).filter(g =>
            g.brand_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [inventory, searchTerm]);

    const totalPages = Math.ceil(groupedInventory.length / itemsPerPage);
    const paginatedInventory = groupedInventory.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getExpiryStatus = (dateStr) => {
        const expiry = new Date(dateStr);
        const today = new Date();
        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) return { color: '#e53e3e', label: 'CRITICAL' };
        if (diffDays <= 90) return { color: '#dd6b20', label: 'NEAR EXPIRY' };
        return { color: '#38a169', label: 'OK' };
    };

    const addToCart = (batch) => {
        const existing = cart.find(c => c.id === batch.id);
        if (existing) {
            alert("This specific batch is already in the cart.");
            return;
        }
        setCart([...cart, { ...batch, selectedQty: 1 }]);
        // Auto-show prescription section if DDA item added
        if (batch.is_controlled) setShowPrescription(true);
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(c => c.id !== id));
    };

    const updateQty = (id, val) => {
        const qty = parseInt(val);
        if (isNaN(qty)) return;
        setCart(cart.map(c => {
            if (c.id === id) {
                const finalQty = qty > c.quantity ? c.quantity : (qty > 0 ? qty : 1);
                return { ...c, selectedQty: finalQty };
            }
            return c;
        }));
    };

    const handleFinalize = async () => {
        const finalClientName = clientName.trim() || "Walk-in Client";
        if (cart.length === 0) return alert("Your cart is empty");

        // DDA Validation
        if (hasDDAItems && (!prescriberName || !patientAge)) {
            return alert("Statutory Requirement: DDA items require Patient Age and Prescriber Name.");
        }

        setLoading(true);
        try {
            const payload = {
                client_name: finalClientName,
                patient_age: patientAge,
                patient_sex: patientSex,
                prescriber_name: prescriberName,
                medical_institution: medicalInstitution,
                dosage_instructions: dosageInstructions,
                items: cart.map(c => ({
                    batch_id: c.id,
                    quantity: c.selectedQty
                }))
            };

            const responseData = await apiPost("/stock/bulk-sell", payload, {
                responseType: 'blob'
            });

            const blob = new Blob([responseData], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Receipt_${finalClientName.replace(/\s+/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            // Reset All Fields
            setCart([]);
            setClientName("");
            setPatientAge("");
            setPatientSex("");
            setPrescriberName("");
            setMedicalInstitution("");
            setDosageInstructions("");
            setShowPrescription(false);
            fetchInventory();
            alert("Sale completed successfully!");
        } catch (err) {
            console.error("Transaction Error:", err);
            alert("Sale failed.");
        } finally {
            setLoading(false);
        }
    };

    const grandTotal = cart.reduce((acc, curr) => acc + (curr.unit_price * curr.selectedQty), 0);

    // Styles
    const containerStyle = { display: 'flex', gap: '30px', padding: '40px', maxWidth: '1400px', margin: 'auto', fontFamily: 'sans-serif' };
    const panelStyle = { flex: 1, background: '#f7fafc', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', height: 'fit-content' };
    const inventoryItemStyle = { padding: '12px', borderBottom: '1px solid #eee', cursor: 'pointer', transition: 'background 0.2s' };
    const batchRowStyle = { padding: '10px 15px', background: '#fff', fontSize: '0.85rem', borderLeft: '4px solid #2d3748', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' };
    const ddaBadge = { background: '#e53e3e', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', marginLeft: '8px' };
    const clinInputStyle = { width: '100%', padding: '8px', border: '1px solid #cbd5e0', borderRadius: '4px', fontSize: '0.85rem' };

    return (
        <div style={containerStyle}>
            {/* INVENTORY PANEL */}
            <div style={panelStyle}>
                <h3>Inventory Search</h3>
                <input
                    type="text"
                    placeholder="Search Brand Name..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    style={{ width: '100%', padding: '12px', marginBottom: '15px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #cbd5e0' }}
                />

                <div style={{ maxHeight: '600px', overflowY: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    {paginatedInventory.map(product => (
                        <div key={product.brand_name}>
                            <div
                                onClick={() => setExpandedProduct(expandedProduct === product.brand_name ? null : product.brand_name)}
                                style={{ ...inventoryItemStyle, background: expandedProduct === product.brand_name ? '#edf2f7' : '#fff' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <strong>{product.brand_name}</strong>
                                        {product.is_controlled && <span style={ddaBadge}>DDA</span>}
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: '#718096' }}>Stock: {product.total_stock}</span>
                                </div>
                            </div>

                            {expandedProduct === product.brand_name && product.batches.map(batch => {
                                const expiryInfo = getExpiryStatus(batch.expiry_date);
                                return (
                                    <div key={batch.id} style={batchRowStyle}>
                                        <div>
                                            <span style={{ color: expiryInfo.color, fontWeight: 'bold', fontSize: '10px' }}>
                                                ● {expiryInfo.label}
                                            </span><br />
                                            <small style={{ color: '#4a5568' }}>Exp: {batch.expiry_date}</small><br />
                                            <small>Batch: {batch.batch_number}</small>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 'bold' }}>KES {batch.unit_price}</div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); addToCart(batch); }}
                                                style={{ fontSize: '0.7rem', padding: '4px 8px', background: '#2d3748', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '4px' }}
                                            >
                                                Add Batch
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {totalPages > 1 && (
                    <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={pageBtnStyle}>Prev</button>
                        <span style={{ alignSelf: 'center', fontSize: '0.9rem' }}>{currentPage} / {totalPages}</span>
                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={pageBtnStyle}>Next</button>
                    </div>
                )}
            </div>

            {/* POS PANEL */}
            <div style={{ ...panelStyle, border: '2px solid #2d3748', background: '#fff', flex: '1.2' }}>
                <h2 style={{ marginTop: 0 }}>PHARMACY POS</h2>

                {/* Client Name */}
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#4a5568' }}>CLIENT / PATIENT NAME</label>
                    <input
                        type="text"
                        placeholder="Enter Client Name (or leave for Walk-in)"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #cbd5e0', borderRadius: '6px' }}
                    />
                </div>

                {/* Clinical Toggle */}
                <div style={{ marginBottom: '20px', padding: '10px', background: hasDDAItems ? '#fff5f5' : '#f8fafc', borderRadius: '8px', border: hasDDAItems ? '1px solid #feb2b2' : '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: hasDDAItems ? '#c53030' : '#2d3748' }}>
                            {hasDDAItems ? "⚠️ CLINICAL DETAILS REQUIRED (DDA)" : "CLINICAL DETAILS / PRESCRIPTION"}
                        </label>
                        <button
                            onClick={() => setShowPrescription(!showPrescription)}
                            style={{ background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
                        >
                            {showPrescription ? "Hide Details" : "Enter Details"}
                        </button>
                    </div>

                    {showPrescription && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
                            <div>
                                <label style={{ fontSize: '0.7rem' }}>PATIENT AGE</label>
                                <input type="text" value={patientAge} onChange={e => setPatientAge(e.target.value)} style={clinInputStyle} placeholder="e.g. 25Y or 6M" />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem' }}>SEX</label>
                                <select value={patientSex} onChange={e => setPatientSex(e.target.value)} style={clinInputStyle}>
                                    <option value="">Select...</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem' }}>PRESCRIBER NAME (Dr.)</label>
                                <input type="text" value={prescriberName} onChange={e => setPrescriberName(e.target.value)} style={clinInputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.7rem' }}>HOSPITAL / CLINIC</label>
                                <input type="text" value={medicalInstitution} onChange={e => setMedicalInstitution(e.target.value)} style={clinInputStyle} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ fontSize: '0.7rem' }}>DOSAGE INSTRUCTIONS</label>
                                <input type="text" value={dosageInstructions} onChange={e => setDosageInstructions(e.target.value)} style={clinInputStyle} placeholder="e.g. 1 tab BD for 5 days" />
                            </div>
                        </div>
                    )}
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #2d3748', textAlign: 'left' }}>
                            <th style={{ padding: '10px 0' }}>Item (Batch)</th>
                            <th>Qty</th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {cart.map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '10px 0' }}>
                                    {item.brand_name} {item.is_controlled && <span style={{ color: '#e53e3e', fontSize: '10px', fontWeight: 'bold' }}>[DDA]</span>}<br />
                                    <small style={{ color: '#718096' }}>Batch: {item.batch_number}</small>
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={item.selectedQty}
                                        onChange={(e) => updateQty(item.id, e.target.value)}
                                        style={{ width: '50px', padding: '5px' }}
                                    />
                                </td>
                                <td style={{ textAlign: 'right' }}>{(item.unit_price * item.selectedQty).toLocaleString()}</td>
                                <td style={{ textAlign: 'right' }}>
                                    <button onClick={() => removeFromCart(item.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {cart.length === 0 && <p style={{ textAlign: 'center', color: '#a0aec0', padding: '20px' }}>Cart is empty</p>}

                <div style={{ marginTop: '20px', textAlign: 'right', fontWeight: 'bold', borderTop: '2px solid #eee', paddingTop: '15px' }}>
                    <div style={{ fontSize: '0.9rem', color: '#718096' }}>Grand Total</div>
                    <div style={{ fontSize: '1.8rem' }}>KES {grandTotal.toLocaleString()}</div>
                </div>

                <button
                    onClick={handleFinalize}
                    disabled={loading || cart.length === 0}
                    style={{
                        width: '100%',
                        padding: '18px',
                        marginTop: '25px',
                        backgroundColor: loading ? '#718096' : '#2d3748',
                        color: '#fff',
                        border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '1.1rem'
                    }}
                >
                    {loading ? "PROCESSING..." : "FINALIZE & DOWNLOAD RECEIPT"}
                </button>
            </div>
        </div>
    );
}

const pageBtnStyle = { padding: '5px 12px', background: '#fff', border: '1px solid #cbd5e0', borderRadius: '4px', cursor: 'pointer' };

export default SellStock;