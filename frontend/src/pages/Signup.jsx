import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../api/api";

function Signup() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("staff");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            await apiPost("/auth/signup", {
                username,
                password,
                full_name: fullName,
                email,          // ✅ REQUIRED
                role,
            });

            setSuccess("User created successfully! Redirecting to login...");

            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (err) {
            if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else {
                setError("Signup failed. Please try again.");
            }
        }
    }

    return (
        <div style={{ padding: "2rem", maxWidth: "400px", margin: "auto" }}>
            <h2>Signup</h2>

            {error && <p style={{ color: "red" }}>{error}</p>}
            {success && <p style={{ color: "green" }}>{success}</p>}

            <form onSubmit={handleSubmit}>
                <input
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
                />

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
                />

                <input
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
                />

                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ width: "100%", marginBottom: "1rem", padding: "0.5rem" }}
                >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                </select>

                <button type="submit" style={{ width: "100%", padding: "0.75rem" }}>
                    Signup
                </button>
            </form>
        </div>
    );
}

export default Signup;
