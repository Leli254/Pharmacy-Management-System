// src/pages/ListStock.jsx
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api/api";

function ListStock() {
    const [stocks, setStocks] = useState([]);
    const [filteredStocks, setFilteredStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Quick sell modal state
    const [sellModal, setSellModal] = useState({ open: false, drug: null, quantity: "" });

    const fetchStock = async () => {
        setLoading(true);
        setError("");

        try {
            const data = await apiGet("/stock/");
            // Filter out expired drugs
            const today = new Date();
            const nonExpired = data.filter((drug) => {
                if (!drug.expiry_date) return true;
                return new Date(drug.expiry_date) >= today;
            });
            setStocks(nonExpired || []);
            setFilteredStocks(nonExpired || []);
        } catch (err) {
            console.error("Failed to load stock:", err);
            setError(err.response?.data?.detail || err.message || "Failed to load stock list");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStock();
    }, [refreshKey]);

    // Search & filter
    useEffect(() => {
        let result = [...stocks];

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(
                (drug) =>
                    drug.name.toLowerCase().includes(term) ||
                    drug.batch_number.toLowerCase().includes(term)
            );
        }

        // Apply sorting
        if (sortConfig.key) {
            result.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === "asc" ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === "asc" ? 1 : -1;
                }
                return 0;
            });
        }

        setFilteredStocks(result);
        setCurrentPage(1); // Reset to first page on filter/sort
    }, [searchTerm, stocks, sortConfig]);

    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const handleRefresh = () => {
        setRefreshKey((prev) => prev + 1);
    };

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredStocks.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredStocks.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Quick Sell
    const openSellModal = (drug) => {
        setSellModal({ open: true, drug, quantity: "" });
    };

    const handleSell = async (e) => {
        e.preventDefault();
        const qty = Number(sellModal.quantity);
        if (!qty || qty <= 0 || qty > sellModal.drug.quantity) {
            setError("Invalid quantity");
            return;
        }

        try {
            await apiPost("/stock/sell", {
                batch_number: sellModal.drug.batch_number,
                quantity: qty,
            });
            setSellModal({ open: false, drug: null, quantity: "" });
            handleRefresh(); // Refresh stock after sell
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to sell stock");
        }
    };

    return (
        <div style={{ maxWidth: "1400px", margin: "2rem auto", padding: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2>Current Stock List (Non-Expired)</h2>
                <button
                    onClick={handleRefresh}
                    disabled={loading}
                    style={{
                        padding: "0.6rem 1.2rem",
                        background: loading ? "#6c757d" : "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: loading ? "not-allowed" : "pointer",
                    }}
                >
                    {loading ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {/* Search */}
            <input
                type="text"
                placeholder="Search by name or batch..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                    width: "100%",
                    padding: "0.6rem",
                    marginBottom: "1rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                }}
            />

            {error && <p style={{ color: "red", fontWeight: "bold", marginBottom: "1rem" }}>{error}</p>}

            {loading ? (
                <p>Loading stock...</p>
            ) : filteredStocks.length === 0 ? (
                <p style={{ color: "#666" }}>No non-expired stock found.</p>
            ) : (
                <>
                    <div style={{ overflowX: "auto", border: "1px solid #dee2e6", borderRadius: "4px" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
                            <thead>
                                <tr style={{ background: "#f8f9fa" }}>
                                    <th style={{ padding: "0.8rem", cursor: "pointer" }} onClick={() => handleSort("name")}>
                                        Medicine {sortConfig.key === "name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th style={{ padding: "0.8rem" }}>Batch</th>
                                    <th style={{ padding: "0.8rem", cursor: "pointer" }} onClick={() => handleSort("expiry_date")}>
                                        Expiry Date {sortConfig.key === "expiry_date" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th style={{ padding: "0.8rem", cursor: "pointer" }} onClick={() => handleSort("quantity")}>
                                        Quantity {sortConfig.key === "quantity" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th style={{ padding: "0.8rem" }}>Unit Price (KES)</th>
                                    <th style={{ padding: "0.8rem" }}>Status</th>
                                    <th style={{ padding: "0.8rem" }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((drug) => (
                                    <tr key={drug.batch_number} style={{ borderBottom: "1px solid #eee" }}>
                                        <td style={{ padding: "0.8rem" }}>{drug.name}</td>
                                        <td style={{ padding: "0.8rem" }}>{drug.batch_number}</td>
                                        <td style={{ padding: "0.8rem" }}>{drug.expiry_date}</td>
                                        <td style={{ padding: "0.8rem" }}>{drug.quantity}</td>
                                        <td style={{ padding: "0.8rem" }}>{drug.unit_price.toFixed(2)}</td>
                                        <td style={{ padding: "0.8rem" }}>
                                            {drug.is_controlled ? (
                                                <span style={{ color: "#dc3545", fontWeight: "bold" }}>Controlled</span>
                                            ) : (
                                                "Regular"
                                            )}
                                        </td>
                                        <td style={{ padding: "0.8rem" }}>
                                            <button
                                                onClick={() => openSellModal(drug)}
                                                style={{
                                                    padding: "0.4rem 0.8rem",
                                                    background: "#007bff",
                                                    color: "white",
                                                    border: "none",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Sell
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                style={{ padding: "0.5rem 1rem", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
                            >
                                Previous
                            </button>
                            <span style={{ padding: "0.5rem 1rem" }}>
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                style={{ padding: "0.5rem 1rem", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Quick Sell Modal */}
            {sellModal.open && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            background: "white",
                            padding: "2rem",
                            borderRadius: "8px",
                            width: "400px",
                            maxWidth: "90%",
                        }}
                    >
                        <h3>Sell {sellModal.drug.name} (Batch: {sellModal.drug.batch_number})</h3>
                        <p>Available: {sellModal.drug.quantity}</p>

                        <form onSubmit={handleSell}>
                            <label>
                                Quantity to sell:
                                <input
                                    type="number"
                                    min="1"
                                    max={sellModal.drug.quantity}
                                    value={sellModal.quantity}
                                    onChange={(e) => setSellModal({ ...sellModal, quantity: e.target.value })}
                                    style={{ width: "100%", padding: "0.5rem", margin: "0.5rem 0" }}
                                    required
                                />
                            </label>

                            <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
                                <button
                                    type="submit"
                                    style={{ padding: "0.6rem 1.2rem", background: "#28a745", color: "white", border: "none", borderRadius: "4px" }}
                                >
                                    Confirm Sell
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSellModal({ open: false, drug: null, quantity: "" })}
                                    style={{ padding: "0.6rem 1.2rem", background: "#dc3545", color: "white", border: "none", borderRadius: "4px" }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ListStock;