# OpsPilot

AI-powered incident management platform for modern software engineering teams.

OpsPilot helps engineers investigate, manage, and resolve production incidents using Generative AI, Retrieval-Augmented Generation (RAG), semantic search, and operational analytics.

---

# 🚀 Live Demo

**Frontend (Vercel)**

https://ops-pilot-gules.vercel.app

**Backend API (Render)**

https://opspilot-9am7.onrender.com

---

# Tech Stack

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?logo=postgresql)
![Google Gemini](https://img.shields.io/badge/Google-Gemini-4285F4?logo=google)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker)
![JWT](https://img.shields.io/badge/Auth-JWT-black)

---

# Portfolio Highlights

- AI-powered incident analysis using Google Gemini
- Retrieval-Augmented Generation (RAG) for operational runbooks
- Semantic search using embeddings
- Similar incident discovery
- PostgreSQL analytics
- JWT authentication
- Dockerized backend
- Production deployment using Vercel and Render
- Operational observability
- Real-time incident dashboard

---

# Overview

When production incidents occur, engineers often spend valuable time searching documentation, investigating previous incidents, and determining the next troubleshooting steps.

OpsPilot streamlines this workflow by providing AI-powered incident analysis, intelligent runbook retrieval, semantic similarity search, and operational analytics.

For every incident, OpsPilot can:

- Analyze incidents using Google Gemini
- Retrieve operational runbooks using Retrieval-Augmented Generation (RAG)
- Find semantically similar historical incidents
- Recommend troubleshooting steps
- Track the complete incident lifecycle
- Record AI interactions for analytics and observability

---

# Features

## Incident Management

- Create incidents
- Update incidents
- Delete incidents
- Track incident status
- Assign priorities
- Maintain investigation timeline
- Add engineering notes

## AI Features

- Google Gemini incident analysis
- Semantic similarity search
- Retrieval-Augmented Generation (RAG)
- AI troubleshooting recommendations
- AI feedback collection
- AI execution analytics

## Analytics

- PostgreSQL event analytics
- Incident lifecycle tracking
- AI usage analytics
- Operational event logging
- Grounding metrics
- Semantic similarity metrics

## Platform

- JWT Authentication
- MongoDB persistence
- PostgreSQL analytics
- Dockerized deployment
- Server-Sent Events (SSE)
- REST API architecture

---

# Tech Stack

## Frontend

- React
- React Router
- Axios

## Backend

- Node.js
- Express.js

## Databases

- MongoDB
- PostgreSQL (Neon)

## Artificial Intelligence

- Google Gemini
- Embeddings
- Retrieval-Augmented Generation (RAG)
- Prompt Engineering
- Semantic Search

## DevOps

- Docker
- Docker Compose
- Vercel
- Render
- GitHub

---

# Architecture

```mermaid
flowchart LR

User["👨‍💻 Engineer"]

Frontend["React Frontend"]

Backend["Express API"]

Auth["JWT Authentication"]

Mongo["MongoDB"]

Analytics["PostgreSQL Analytics"]

Gemini["Google Gemini"]

Embeddings["Embedding Service"]

Runbooks["Runbook Retrieval (RAG)"]

User --> Frontend

Frontend --> Backend

Backend --> Auth

Backend --> Mongo

Backend --> Analytics

Backend --> Gemini

Backend --> Embeddings

Backend --> Runbooks

Embeddings --> Mongo

Runbooks --> Gemini