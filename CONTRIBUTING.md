Thank you for considering contributing to the Pharmacy Management System.
Contributions of all kinds are welcome — bug reports, feature requests, documentation improvements, and code contributions.

This document outlines the process and expectations for contributors.

---

## 📌 Code of Conduct

By participating in this project, you agree to uphold a respectful, professional, and inclusive environment.

- Be respectful and constructive

- Assume good intentions

- No harassment, discrimination, or abusive language

Serious or repeated violations may result in removal from the project.

---

## 🧩 How You Can Contribute

You can contribute in several ways:

- 🐞 Reporting bugs

- 💡 Proposing features or improvements

- 🛠️ Fixing bugs

- 📚 Improving documentation

- 🧪 Adding tests

- 🎨 Improving UI/UX

## 🐞 Reporting Bugs

Before opening a bug report:

1. Ensure the issue has not already been reported.

2. Reproduce the issue on the latest version.

When submitting a bug report, include:

- Clear description of the problem

- Steps to reproduce

- Expected vs actual behavior

- Logs or error messages (if applicable)

- Environment details (OS, browser, Docker version)

---

## 💡 Feature Requests

Feature requests are welcome.

Please include:

- The problem the feature solves

- Proposed solution or behavior

- Why it is useful for pharmacy operations

---

## 🛠️ Development Setup

**Prerequisites**

- Docker & Docker Compose

- Node.js (for frontend development)

- Python 3.12+

- Git

---

**Clone the Repository**

```
   git clone https://github.com/<your-username>/PharmacyTracker.git
   cd PharmacyTracker
```

---

**Environment Variables**

Create a ```.env``` file from the example:

```cp .env.example .env```


Fill in the required values.

> ⚠️ Never commit .env files

---

**Run the Project**
```
docker compose up --build
```


- Backend: http://localhost:8000

- Frontend: http://localhost:5173

- API Docs: http://localhost:8000/docs

---

## 🧱 Project Structure

```
PharmacyTracker/
├── app/                # FastAPI backend
├── frontend/           # React frontend
├── docker-compose.yml
├── README.md
├── CONTRIBUTING.md
├── LICENSE
```

---

## 🔐 Authentication Notes

- Uses OAuth2 password flow

- JWT tokens stored in localStorage

- Protected routes require authentication

Ensure your changes do not weaken authentication or security.

---

## 🧪 Testing

Before submitting a pull request:

- Ensure the app starts without errors

- Run backend tests if available

- Verify frontend functionality manually

Tests are expected for:

- New features

- Bug fixes affecting core logic

---

## 🧼 Code Style & Standards

**Backend (FastAPI / Python)**

- Follow PEP 8

- Use type hints where possible

- Keep functions small and focused

- Use dependency injection properly

**Frontend (React)**

- Functional components only

- Avoid unnecessary state

- Keep components small and reusable

- Prefer clarity over cleverness

---

## 🌱 Git Workflow

1. Fork the repository

2. Create a feature branch:

```
git checkout -b feature/short-description
```


3. Make your changes

4. Commit with clear messages:
   e.g

```
git commit -m "Add stock audit export feature"
```


5. Push to your fork

6. Open a Pull Request

---

## 📦 Pull Request Guidelines

Your PR should:

- Have a clear title and description

- Reference related issues (if any)

- Be focused (avoid mixing unrelated changes)

- Pass all checks

- Not include generated files, secrets, or environment files

Large PRs may be requested to be split.

---

### 🚫 What Not to Commit

- .env files

- Virtual environments

- node_modules

- site-packages

- Database files (*.db)

- Build artifacts

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License, the same license as the project.

---

## 🙏 Thank You

Your contributions help improve pharmacy operations and healthcare tooling.

If you have questions, open an issue or start a discussion — we’re happy to help.

---
