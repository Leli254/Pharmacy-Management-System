import { useState } from "react";
import { useNavigate } from "react-router-dom";
import bcrypt from 'bcryptjs';

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    // Recovery States
    const [isRecovering, setIsRecovering] = useState(false);
    const [recoveryPin, setRecoveryPin] = useState("");

    async function handleLogin(e) {
        e.preventDefault();
        setError("");

        try {
            const formData = new URLSearchParams({
                grant_type: "password",
                username: username,
                password: password
            });

            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData.toString(),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || "Login failed");

            // Save session
            localStorage.setItem("access_token", data.access_token);
            localStorage.setItem("user_role", data.role);
            localStorage.setItem("username", data.username);

            // CACHE THE PIN HASH for offline verification later
            localStorage.setItem(`recovery_hash_${data.username}`, data.recovery_pin_hash);

            navigate("/dashboard");
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleOfflineRecovery() {
        setError("");
        const cachedHash = localStorage.getItem(`recovery_hash_${username}`);

        if (!cachedHash) {
            setError("No recovery data found for this user on this device.");
            return;
        }

        try {
            // 1. Local comparison using bcrypt (matches the raw bcrypt on backend)
            const isMatch = bcrypt.compareSync(recoveryPin, cachedHash);

            if (isMatch) {
                const newPass = prompt("Identity Verified! Enter your new password (min 6 characters):");

                if (newPass && newPass.length >= 6) {
                    // 2. Immediate Attempt to update the Database (Docker Backend)
                    try {
                        const response = await fetch("/api/auth/reset-password-sync", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                username: username,
                                new_password: newPass
                            }),
                        });

                        if (!response.ok) throw new Error("Database update failed");

                        alert("Success! Password updated in the database. You can now login with your new password.");
                        setIsRecovering(false);
                        setRecoveryPin("");
                    } catch (syncErr) {
                        // 3. Fallback: If Docker Backend is unreachable, save for background sync
                        console.warn("Backend unreachable. Saving locally.");
                        localStorage.setItem("pending_new_password", newPass);
                        localStorage.setItem("needs_password_sync", "true");
                        localStorage.setItem("username", username);

                        alert("Server unreachable. Password changed locally and will sync when the server is back up.");
                        setIsRecovering(false);
                        setRecoveryPin("");
                    }
                } else if (newPass) {
                    alert("Password too short! Must be at least 6 characters.");
                }
            } else {
                setError("Incorrect Recovery PIN.");
            }
        } catch (err) {
            console.error("Verification error:", err);
            setError("System error during verification.");
        }
    }

    return (
        <div style={{ maxWidth: 400, margin: "50px auto", padding: "20px", border: "1px solid #ddd", borderRadius: "8px", fontFamily: 'sans-serif' }}>
            <h2 style={{ textAlign: 'center', color: '#2d3748' }}>
                {isRecovering ? "Reset Password" : "Pharmacy Login"}
            </h2>

            {error && <p style={{ color: "#e53e3e", textAlign: 'center', background: '#fff5f5', padding: '10px', borderRadius: '4px', fontSize: '14px' }}>{error}</p>}

            {!isRecovering ? (
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required style={inputStyle} />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
                    <button type="submit" style={btnStyle}>Login</button>
                    <p onClick={() => setIsRecovering(true)} style={{ color: '#3182ce', cursor: 'pointer', textAlign: 'center', fontSize: '14px' }}>Forgot Password?</p>
                </form>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <p style={{ fontSize: '13px', color: '#4a5568', textAlign: 'center' }}>
                        Enter your username and the 4-digit PIN you created during signup.
                    </p>
                    <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} />
                    <input
                        type="password"
                        placeholder="4-digit PIN"
                        value={recoveryPin}
                        maxLength={4}
                        onChange={(e) => setRecoveryPin(e.target.value.replace(/\D/g, ''))}
                        style={{ ...inputStyle, textAlign: 'center', letterSpacing: '0.5rem', fontSize: '20px' }}
                    />
                    <button onClick={handleOfflineRecovery} style={{ ...btnStyle, background: '#2f855a' }}>Verify & Reset</button>
                    <button onClick={() => setIsRecovering(false)} style={{ background: 'none', border: 'none', color: '#718096', cursor: 'pointer', fontSize: '14px' }}>Back to Login</button>
                </div>
            )}
        </div>
    );
}

const inputStyle = { padding: '12px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '16px' };
const btnStyle = { padding: '12px', background: '#3182ce', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' };

export default Login;