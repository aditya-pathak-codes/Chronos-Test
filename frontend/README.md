# ⏳ Project Chronos  
### ICU Predictive Stability Engine (HealthTech Track — Beyond Telemedicine)

> Forecast cardiac arrest, septic shock, and blood pressure collapse **2–6 hours before they occur** using explainable AI — running 100% locally with zero cloud dependency.

---

## 🧠 Overview

Project Chronos is an AI-powered clinical decision support system designed for ICU environments.  
It analyzes patient vitals and predicts the likelihood of critical deterioration across **multiple time horizons (2h / 6h / 12h)**.

Instead of reacting to emergencies, Chronos enables **proactive intervention**, helping healthcare professionals prioritize high-risk patients before a crisis occurs.

---

## 🚀 Key Features

### 🔴 1. 3-Horizon Risk Prediction
- Simultaneous prediction for:
  - 2 hours
  - 6 hours
  - 12 hours
- Provides a **risk trajectory**, not just a single snapshot

---

### 🧾 2. Explainable AI (SHAP)
- Displays **top 3 clinical factors** behind each prediction
- Converts model outputs into **human-readable insights**
- Builds trust and transparency for medical professionals

---

### 🟢 3. Clinical Triage System
- Patients categorized into:
  - **GREEN** → Stable
  - **AMBER** → Monitor closely
  - **RED** → Immediate intervention required
- Inspired by real-world clinical scoring systems

---

### 📈 4. Risk Velocity Tracking
- Tracks how fast a patient's condition is changing
- Displays **rate of risk increase/decrease per hour**
- Identifies rapidly deteriorating patients early

---

### 🎬 5. Live Deterioration Simulation
- Replay a full patient deterioration scenario
- Visualizes transition:
  - GREEN → AMBER → RED
- Demonstrates real-time system capability

---

### 🎛️ 6. What-If Analysis (Counterfactuals)
- Adjust vitals (MAP, HR, SpO₂) using sliders
- Instantly see how risk changes
- Helps doctors explore **intervention impact**

---

## 🏗️ System Architecture (Team Syndicate)
