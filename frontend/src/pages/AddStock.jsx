import { useState } from "react";
import { apiPost } from "../api/api";   // ← prefer apiPost for simplicity

function AddStock() {
    const [name, setName] = useState("");
    const [batchNumber, setBatchNumber] = useState("BATCH-" + Date.now().toString().slice(-6));
    const [expiryDate, setExpiryDate] = useState("");
    const [quantity, setQuantity] = useState("");
    const [price, setPrice] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setMessage("");
        setError("");

        try {
            await apiPost("/stock/", {
                name: name.trim(),
                batch_number: batchNumber.trim(),
                expiry_date: expiryDate,                     // must be YYYY-MM-DD
                quantity: Number(quantity),
                unit_price: Number(price),
                is_controlled: false,
            });

            setMessage("Stock added successfully!");
            // Reset form
            setName("");
            setBatchNumber("BATCH-" + Date.now().toString().slice(-6));
            setExpiryDate("");
            setQuantity("");
            setPrice("");
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.detail || err.message || "Failed to add stock";
            setError(errMsg);
        }
    }

    return (
        <div className="container">
            <h2>Add New Stock</h2>

            {error && <p className="error" style={{ color: "red" }}>{error}</p>}
            {message && <p className="success" style={{ color: "green" }}>{message}</p>}

            <form onSubmit={handleSubmit}>
                <input
                    placeholder="Medicine name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                <input
                    placeholder="Batch number"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    required
                />

                <input
                    type="date"
                    placeholder="Expiry date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                />

                <input
                    type="number"
                    placeholder="Quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                    required
                />

                <input
                    type="number"
                    placeholder="Unit price (KES)"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0.01"
                    step="0.01"
                    required
                />

                <button type="submit">Add Stock</button>
            </form>
        </div>
    );
}

export default AddStock;