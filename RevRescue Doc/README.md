# 🛡️ RevRescue: AI-Powered Customer Support Refund System
### WORKNOON Full Stack Engineer Take-Home Assessment

> **A production-minded, full-stack application that evaluates, approves, denies, and escalates e-commerce refund requests using a hybrid deterministic policy engine and Google Gemini AI deliberation.**

---

## 📚 Documentation Index

This directory contains the complete technical blueprint, specifications, and evaluation materials for RevRescue:

1. 📐 **[Architecture & System Design](file:///c:/Users/chrisokoriedev/Documents/work/RevRescue/RevRescue%20Doc/architecture_and_system_design.md)**
   * High-level architectural diagram, sequence diagram of refund lifecycle, REST API endpoint contracts, and containerization strategy.

2. 📜 **[Refund Policy Specification & Synthetic Data](file:///c:/Users/chrisokoriedev/Documents/work/RevRescue/RevRescue%20Doc/refund_policy_specification.md)**
   * Complete business rules (`POL-001` through `POL-005`), ERD schema, and test matrix of all 15 customer personas.

3. 🤖 **[AI Integration & Security Guardrails](file:///c:/Users/chrisokoriedev/Documents/work/RevRescue/RevRescue%20Doc/ai_integration_and_security.md)**
   * Gemini Flash prompt engineering, structured Zod schemas, dual-layer prompt injection defense, and offline fallback mode.

4. 🎥 **[Demo Walkthrough Script & Evaluation Rubric](file:///c:/Users/chrisokoriedev/Documents/work/RevRescue/RevRescue%20Doc/demo_walkthrough_and_rubric.md)**
   * 3-minute video presentation script, evaluator testing cheat-sheet, and mapping against WORKNOON's evaluation criteria.

---

## ⚡ Quick Start Summary

To run the entire platform locally with a single command:

```bash
# In project root
docker-compose up --build
```

- **Customer Refund Portal**: `http://localhost:3000`
- **Support Admin Dashboard**: `http://localhost:3000/admin`
- **Backend API & Health Check**: `http://localhost:5000/health`
