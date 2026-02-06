import { useState } from "react";
import { apiPost } from "../api/api";
import { useNavigate } from "react-router-dom";

function AddGeneric() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setMessage("");
        setError("");
        setLoading(true);

        try {
            // Prepare the data according to the API schema
            const data = {
                name: name.trim(),
                description: description.trim() || null
            };

            await apiPost("/stock/generics", data);
            setMessage("Generic added successfully!");
            setName("");
            setDescription("");
            setTimeout(() => navigate("/add-stock"), 1500);
        } catch (err) {
            console.error("API Error:", err);
            console.error("Error response:", err.response?.data);

            // Handle 401 Unauthorized
            if (err.response?.status === 401) {
                setError("Unauthorized. Please log in again.");
                // Optionally redirect to login
                // setTimeout(() => navigate("/login"), 2000);
                return;
            }

            // Handle 422 Validation Error
            const errorDetail = err.response?.data?.detail;

            if (typeof errorDetail === 'string') {
                setError(errorDetail);
            } else if (Array.isArray(errorDetail)) {
                const formattedErrors = errorDetail.map(err => {
                    const field = err.loc?.[1] || 'field';
                    return `${field}: ${err.msg}`;
                }).join('\n');
                setError(formattedErrors);
            } else if (errorDetail?.msg) {
                setError(errorDetail.msg);
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.message) {
                setError(err.message);
            } else {
                setError("Failed to add generic. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="container">
            <h2>Add New Generic Drug</h2>

            {error && (
                <div style={{
                    color: "#c53030",
                    whiteSpace: 'pre-line',
                    textAlign: 'left',
                    backgroundColor: '#fff5f5',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    margin: '16px 0',
                    border: '1px solid #fed7d7',
                    fontSize: '14px'
                }}>
                    <strong style={{ display: 'block', marginBottom: '4px' }}>Error:</strong>
                    <div>{error}</div>
                </div>
            )}

            {message && (
                <div style={{
                    color: "#276749",
                    backgroundColor: '#f0fff4',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    margin: '16px 0',
                    border: '1px solid #c6f6d5',
                    fontSize: '14px'
                }}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        Generic Name *
                    </label>
                    <input
                        placeholder="Enter generic name (e.g. Paracetamol)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            margin: '4px 0',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '16px',
                            transition: 'border-color 0.2s',
                            boxSizing: 'border-box'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3182ce'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                        Description (Optional)
                    </label>
                    <textarea
                        placeholder="Enter description or therapeutic class"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '12px',
                            margin: '4px 0',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '16px',
                            minHeight: '120px',
                            resize: 'vertical',
                            transition: 'border-color 0.2s',
                            boxSizing: 'border-box'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3182ce'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            flex: 1,
                            padding: '12px 24px',
                            backgroundColor: loading ? '#90cdf4' : '#3182ce',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '16px',
                            fontWeight: '500',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        {loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ marginRight: '8px' }}>Processing...</span>
                            </span>
                        ) : 'Add Generic'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate("/add-stock")}
                        disabled={loading}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '16px',
                            fontWeight: '500',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.2s'
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddGeneric;