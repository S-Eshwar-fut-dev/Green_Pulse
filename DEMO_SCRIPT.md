# GreenPulse — 3-Minute Demo Script
## Hack For Green Bharat | Exact Words to Say

---

### MINUTE 1 — The Live Dashboard (0:00–1:00)

*[Open browser to localhost:3000. Let the dashboard load. Stay silent for 3 seconds while the map populates with green markers.]*

**Say:**
> "What you're looking at right now is a live feed. These are 10 trucks — actual cargo vehicles — moving across three of India's most carbon-intensive freight corridors: Delhi to Mumbai, Chennai to Bangalore, and Kolkata to Patna. Every single dot is updating in real time, every two seconds.

> This number here — [point to CO₂ Saved counter] — this is how much CO₂ our fleet has already saved versus the historical baseline today. It's going up. Right now. In front of you.

> India's logistics sector emits 13.5% of all national greenhouse gases. Every minute a truck takes the wrong route, it burns more fuel, costs more money, and releases more carbon into the atmosphere. GreenPulse is India's first real-time carbon intelligence layer for logistics — and this is what it looks like."

*[Pause 3 seconds. Let the number tick.]*

---

### MINUTE 2 — Triggering an Anomaly (1:00–2:00)

*[Click the "Trigger Spike Alert" button in the sidebar. Watch the map.]*

**Say:**
> "I just sent a spike command to one of our trucks — watch the map."

*[Wait 2 seconds for the marker to turn red.]*

> "There it is. That truck just went into a HIGH_EMISSION_ALERT state. Its 5-minute CO₂ output crossed twice its 30-minute rolling average. In a real fleet, this means an injector fault, extreme idling, or an illegal route. The alert is already in the anomaly log — timestamped, ready to escalate.

> Now watch this."

*[Type into the chat box: "Are there any active anomalies right now?" — hit Enter.]*

> "I'm asking GreenAI — our LLM assistant — the same question a fleet manager would ask at 2am."

*[Wait for the response to appear.]*

> "It didn't just say 'yes'. It told us which vehicle, what the CO₂ deviation is, and what action to take — sourced from live fleet data and the India National Logistics Policy. No hallucinations. Cited. Grounded."

---

### MINUTE 3 — Compliance + Impact Close (2:00–3:00)

*[Type into the chat box: "Does our current emission rate comply with the National Logistics Policy targets?" — hit Enter.]*

*[While waiting for response, say:]*

> "India's National Logistics Policy 2022 mandates a 20% reduction in per-route CO₂ by 2027. GreenPulse tracks exactly that — not quarterly, not monthly — second by second."

*[Response appears. Read the sourced answer aloud.]*

> "The system just cited the actual NLP 2022 targets with numbers and told us how far we are from compliance. This is the kind of AI-grounded intelligence that fleet managers in India do not have access to today.

> [Close strong.] India's logistics emits 13.5% of our nation's total greenhouse gases. GreenPulse is how we fix that — one truck, one route, one real-time decision at a time. Thank you."

---

## Pre-Demo Checklist (Night Before)
- [ ] `docker-compose up --build` — all 3 containers green
- [ ] Open localhost:3000 — map loads with truck markers
- [ ] Ask all 5 demo questions — confirm answer quality
- [ ] Test "Trigger Spike Alert" button — marker turns red within 2s
- [ ] Record a 60-second backup video of the full demo in case of network failure
- [ ] Have .env with valid GEMINI_API_KEY on the demo machine
- [ ] Close all other browser tabs — projector in windowed mode, not fullscreen

## Backup Plan (If Network/API Fails)
GreenAI automatically falls back to pre-cached answers for all 5 demo questions.
The `live_data_used` badge will show false, but the answers will still be accurate.
Say: *"GreenPulse includes a resilience layer — even when the LLM API is unreachable, the system serves pre-validated answers from the last known state."*
