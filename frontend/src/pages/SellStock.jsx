import { useEffect, useState } from "react";
import { apiPost, apiRequest } from "../api/api";  // Import both helpers

function SellStock() {
    const [stocks, setStocks] = useState([]);
    const [batchNumber, setBatchNumber] = useState("");
    const [quantity, setQuantity] = useState("");
    const [message, setMessage] = useState("");
    const [warning, setWarning] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    // Load current stock on component mount
    useEffect(() => {
        const fetchStock = async () => {
            setLoading(true);
            setError("");
            try {
                // GET request → use apiRequest with "get" method
                const data = await apiRequest("get", "/stock/");
                setStocks(data || []);
            } catch (err) {
                const errMsg = err.response?.data?.detail || err.message || "Failed to load stock";
                setError(errMsg);
            } finally {
                setLoading(false);
            }
        };

        fetchStock();
    }, []);

    async function handleSell(e) {
        e.preventDefault();
        setMessage("");
        setWarning("");
        setError("");

        if (!batchNumber) {
            setError("Please select a batch");
            return;
        }

        if (!quantity || Number(quantity) <= 0) {
            setError("Please enter a valid quantity");
            return;
        }

        try {
            const response = await apiPost("/stock/sell", {
                batch_number: batchNumber,
                quantity: Number(quantity),
            });

            setMessage(response.message);

            if (response.warning) {
                setWarning(response.warning);
            }

            // Refresh stock list after successful sale
            const updatedData = await apiRequest("get", "/stock/");
            setStocks(updatedData || []);

            // Reset form
            setQuantity("");
            setBatchNumber("");
        } catch (err) {
            console.error("Sell error:", err);
            const errMsg =
                err.response?.data?.detail ||
                err.message ||
                "Failed to sell stock. Please try again.";
            setError(errMsg);
        }
    }

    return (
        <div className="container">
            <h2>Sell Stock</h2>

            {error && <p className="error" style={{ color: "red" }}>{error}</p>}
            {message && <p className="success" style={{ color: "green" }}>{message}</p>}
            {warning && <p className="warning" style={{ color: "orange" }}>{warning}</p>}

            {loading ? (
                <p>Loading available stock...</p>
            ) : stocks.length === 0 ? (
                <p>No stock available to sell.</p>
            ) : (
                <form onSubmit={handleSell}>
                    <select
                        value={batchNumber}
                        onChange={(e) => setBatchNumber(e.target.value)}
                        required
                    >
                        <option value="">Select medicine (batch)</option>
                        {stocks.map((drug) => (
                            <option key={drug.batch_number} value={drug.batch_number}>
                                {drug.name} — Batch {drug.batch_number} (Qty: {drug.quantity})
                            </option>
                        ))}
                    </select>

                    <input
                        type="number"
                        min="1"
                        placeholder="Quantity to sell"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                    />

                    <button type="submit">Sell</button>
                </form>
            )}
        </div>
    );
}

export default SellStock;