// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        try {
            const formData = new URLSearchParams();
            formData.append("grant_type", "password"); // REQUIRED
            formData.append("username", username);
            formData.append("password", password);

            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData.toString(),
            });

            if (!response.ok) {
                throw new Error("Login failed");
            }

            const data = await response.json();

            localStorage.setItem("access_token", data.access_token);
            navigate("/dashboard");

        } catch {
            setError("Invalid username or password");
        }
    }

    return (
        <div style={{ maxWidth: 400, margin: "50px auto" }}>
            <h2>Pharmacy Tracker Login</h2>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <form onSubmit={handleSubmit}>
                <input
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button type="submit">Login</button>
            </form>
        </div>
    );
}

export default Login;
