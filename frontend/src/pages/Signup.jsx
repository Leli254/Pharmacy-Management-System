import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../api/api";

function Signup() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");

    // Simplified Recovery State: 4-digit PIN
    const [recoveryPin, setRecoveryPin] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Basic frontend validation for the PIN length
        if (recoveryPin.length !== 4) {
            setError("Recovery PIN must be exactly 4 digits.");
            return;
        }

        try {
            // THE PAYLOAD: email removed to match the updated Schema and Model
            await apiPost("/auth/signup", {
                username: username,
                password: password,
                full_name: fullName,
                recovery_pin: recoveryPin
            });

            setSuccess("Account created! Redirecting to login...");
            setTimeout(() => navigate("/login"), 2000);
        } catch (err) {
            console.error("[Signup Error]:", err);
            const detail = err.response?.data?.detail;

            // Handles Pydantic's array of errors to show exactly which field failed
            if (Array.isArray(detail)) {
                const fieldName = detail[0].loc[1].replace('_', ' ');
                const errorMessage = detail[0].msg;
                setError(`${fieldName}: ${errorMessage}`);
            } else {
                setError(detail || "Signup failed. Please check your connection.");
            }
        }
    }

    // Helper to ensure only numbers are entered for the PIN
    const handlePinChange = (e) => {
        const val = e.target.value.replace(/\D/g, ""); // Remove non-digits
        if (val.length <= 4) {
            setRecoveryPin(val);
        }
    };

    return (
        <div style={containerStyle}>
            <h2 style={{ textAlign: "center", color: "#2d3748" }}>Pharmacy Signup</h2>

            {error && <div style={errorStyle}>{error}</div>}
            {success && <div style={successStyle}>{success}</div>}

            <form onSubmit={handleSubmit}>
                <div style={fieldGroup}>
                    <label style={labelStyle}>Full Name</label>
                    <input
                        placeholder="Enter full name"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        required
                        style={inputStyle}
                    />
                </div>

                <div style={fieldGroup}>
                    <label style={labelStyle}>Username</label>
                    <input
                        placeholder="Choose a username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        required
                        style={inputStyle}
                    />
                </div>

                <div style={fieldGroup}>
                    <label style={labelStyle}>Password</label>
                    <input
                        type="password"
                        placeholder="Min. 6 characters"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        style={inputStyle}
                    />
                </div>

                <div style={recoveryBoxStyle}>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#2c5282' }}>Recovery Setup</p>
                    <label style={{ ...labelStyle, marginBottom: '10px' }}>Create a 4-digit PIN to reset your password if forgotten.</label>
                    <input
                        type="password"
                        inputMode="numeric"
                        placeholder="0 0 0 0"
                        value={recoveryPin}
                        onChange={handlePinChange}
                        required
                        style={{ ...inputStyle, letterSpacing: '0.8rem', textAlign: 'center', fontSize: '20px' }}
                    />
                </div>

                <button type="submit" style={btnStyle}>Register Account</button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '14px' }}>
                Already have an account? <span onClick={() => navigate("/login")} style={{ color: '#3182ce', cursor: 'pointer' }}>Login</span>
            </p>
        </div>
    );
}

// Styles
const containerStyle = { padding: "2rem", maxWidth: "420px", margin: "2rem auto", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", background: "white" };
const fieldGroup = { marginBottom: "1rem" };
const inputStyle = { width: "100%", padding: "0.75rem", boxSizing: "border-box", borderRadius: "6px", border: "1px solid #cbd5e0", fontSize: "16px" };
const recoveryBoxStyle = { background: "#ebf8ff", padding: "15px", borderRadius: "8px", marginBottom: "1.5rem", border: "1px solid #bee3f8" };
const labelStyle = { display: "block", fontSize: "13px", fontWeight: "600", color: "#4a5568", marginBottom: "5px" };
const btnStyle = { width: "100%", padding: "0.85rem", background: "#3182ce", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "16px" };
const errorStyle = { color: "#c53030", background: "#fff5f5", padding: "12px", borderRadius: "6px", marginBottom: "1.5rem", textAlign: "center", fontSize: "14px", border: "1px solid #feb2b2" };
const successStyle = { color: "#2f855a", background: "#f0fff4", padding: "12px", borderRadius: "6px", marginBottom: "1.5rem", textAlign: "center", fontSize: "14px", border: "1px solid #9ae6b4" };

export default Signup;