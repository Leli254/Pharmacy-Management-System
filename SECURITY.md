# Security Policy
---

## Supported Versions

The following versions of Pharmacy Inventory Tracker are currently supported with security updates:

**Version	Supported**
- main	✅ Yes
- Older releases	❌ No

Only the latest version on the ```main``` branch receives security patches.

---

## Reporting a Vulnerability

If you discover a security vulnerability, **do not open a public GitHub issue**.

Instead, report it responsibly using one of the following methods:

###### 🔐 Preferred: GitHub Security Advisories

1. Go to the repository on GitHub

2. Click Security → Report a vulnerability

3. Submit the report privately

###### 📧 Alternative: Email

If GitHub Security Advisories are unavailable, email:

> lelisoftware[@]gmail.com

---

## What to Include in a Report

Please include as much of the following as possible:

- Description of the vulnerability

- Steps to reproduce

- Affected endpoints, components, or files

- Potential impact

- Proof of concept (if available)

- Suggested remediation (optional)

Clear and detailed reports help us respond faster.

---

### Response Timeline

We aim to follow this timeline:

``` text

| Stage               | Target Time              |
|---------------------|--------------------------|
| Acknowledgement     | Within 48 hours          |
| Initial Assessment  | Within 72 hours          |
| Fix or Mitigation   | As soon as possible      |
| Public Disclosure   | After patch release      |

```

Timelines may vary depending on severity and complexity.

---

## Security Scope

**In Scope**

- Authentication & authorization

- JWT handling

- Password hashing

- API endpoints

- Docker configuration

- Dependency vulnerabilities

- Database access control

- CORS configuration

**Out of Scope**

- Denial of service attacks

- Social engineering

- Physical security

- Third-party service vulnerabilities, unless directly caused by this codebase

---

### Security Best Practices Used

This project follows these practices:

- Argon2 password hashing

- OAuth2 password flow

- JWT-based authentication

- Protected API routes

- CORS restrictions

- Environment variables for secrets

- Docker container isolation

---

## Dependency Security

- Dependencies should be kept up to date

- Known vulnerable dependencies should be upgraded promptly

- Automated dependency scanning is encouraged (e.g., Dependabot)

---

## Disclosure Policy

We practice responsible disclosure:

- Vulnerabilities are fixed before public disclosure

- Credit is given to reporters unless anonymity is requested

- No legal action will be taken against good-faith researchers

---

## Security Contact

For all security-related matters:

> lelisoftware[@]gmail.com

---

## Thank You

We appreciate the efforts of security researchers and contributors who help keep this project safe.

Your responsible disclosures help protect pharmacies and their data.

---
