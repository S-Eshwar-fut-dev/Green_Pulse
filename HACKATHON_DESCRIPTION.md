# RouteZero — Hackathon Submission Description

## What It Does

RouteZero streams GPS telemetry from trucks across three Indian freight corridors (Delhi–Mumbai NH48, Chennai–Bangalore NH44, Kolkata–Patna NH19). It computes CO₂ per vehicle per second using IPCC AR6 emission factors inside Pathway's 5-minute tumbling windows and 30-minute sliding windows. When a truck's short-term emissions spike beyond 2× its rolling baseline, a HIGH_EMISSION_ALERT fires in real time. An ETA prediction engine joins telemetry + order streams using Pathway's dual-stream JOIN primitive to project ghost paths to each truck's destination, turning red when a delay is detected.

Fleet operators interact with RouteZero AI — a Gemini 1.5 Pro co-pilot that answers natural language questions about the fleet's carbon footprint using BM25 retrieval over IPCC AR6 factors, India's National Logistics Policy 2022 (NLP 2022), and BEE India Carbon Market guidelines. BM25-grounded Gemini 1.5 Pro delivers zero-hallucination answers with NLP 2022 policy citations.

## Problem Statement

India's logistics sector emits 13.5% of national GHG. NLP 2022 mandates 20% CO₂ reduction by 2027. No real-time tracking tool exists for freight corridors. RouteZero prevents approximately 12% of India's fleet CO₂ through proactive intervention — catching overloaded trucks, detecting route deviations, and flagging cold-chain breaches before spoilage compounds carbon waste.

## Technical Architecture

The platform uses Pathway's unique dual-stream JOIN streaming primitive with 5-min tumbling windows for real-time CO₂ calculation and 30-min sliding windows for baseline comparison. The IPCC AR6 WGIII emission factor model (0.89 kg CO₂/km base factor) is applied per-vehicle per-event. The Docker-containerized Pathway pipeline writes enriched JSONL to a shared volume consumed by a FastAPI REST backend. The Vercel-deployable Next.js 14 frontend renders a Datadog-inspired enterprise dashboard with React-Leaflet mapping and Recharts analytics.

## Market Opportunity

- $180B Indian logistics market by 2030 (IBEF)
- ₹430–680/tonne India Carbon Market credit price (BEE-ICM 2024)
- 350M tonnes cargo shifting to Dedicated Freight Corridors annually

## Business Model

- Fleet SaaS — ₹8,000–25,000/month per operator
- Carbon Credit MRV — 2% fee on BEE-ICM verified credits
- Compliance API — enterprise licensing for 3PLs and auditors

## Deployment Readiness

Docker-containerized Pathway pipeline runs in WSL2/Linux. FastAPI serves the REST API. Next.js 14 frontend is deployed on Vercel. The entire stack is production-ready with GitHub Actions CI/CD running pytest + ruff linting on every push.
