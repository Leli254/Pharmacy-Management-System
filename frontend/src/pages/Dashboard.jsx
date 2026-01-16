import React from "react";

export default function Dashboard() {
    return (
        <div style={{ maxWidth: "800px", margin: "2rem auto", padding: "1rem" }}>
            <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
                Dashboard
            </h1>

            <p style={{ fontSize: "1.1rem", color: "#555" }}>
                Welcome to your Pharmacy Inventory Tracker.
            </p>

            {/* Placeholder for future widgets */}
            <div style={{ marginTop: "2rem" }}>
                <div
                    style={{
                        padding: "1rem",
                        backgroundColor: "#f7f7f7",
                        borderRadius: "8px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        marginBottom: "1rem",
                    }}
                >
                    <h2 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
                        Quick Stats
                    </h2>
                    <p>Stock levels, sales summary, and alerts will appear here.</p>
                </div>
            </div>
        </div>
    );
}
