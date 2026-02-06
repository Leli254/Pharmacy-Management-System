// src/components/Footer.jsx
import React from "react";

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer style={footerStyle}>
            <div style={containerStyle}>
                <div style={sectionStyle}>
                    <span style={statusDot}></span>
                    <span>System Status: <strong>Active | Running</strong></span>
                </div>

                <div style={sectionStyle}>
                    &copy; {year} Pharmacy Management System
                </div>

                <div style={sectionStyle}>
                    Powered by <a
                        href="https://github.com/Leli254"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={linkStyle}
                    >
                        Leli254
                    </a>
                </div>
            </div>
        </footer>
    );
}

const footerStyle = {
    width: '100%',
    background: '#1a202c',
    color: '#edf2f7',
    padding: '12px 0',
    fontSize: '13px',
    borderTop: '2px solid #3182ce',
    marginTop: 'auto'
};

const containerStyle = {
    maxWidth: '1300px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
    flexWrap: 'wrap',
    gap: '10px'
};

const sectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
};

const statusDot = {
    height: '8px',
    width: '8px',
    backgroundColor: '#48bb78',
    borderRadius: '50%',
    display: 'inline-block'
};

const linkStyle = {
    color: '#63b3ed',
    textDecoration: 'none',
    fontWeight: 'bold'
};