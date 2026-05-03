import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './index.css'

const API_BASE = 'http://localhost:8000'
const SESSION_KEY = 'chronos-doctor-session'

const doctors = [
  {
    id: 'dr-anjali-rao',
    name: 'Dr. Anjali Rao',
    staffId: 'RAO-ICU',
    email: 'rao@chronos.health',
    password: 'chronos123',
    specialty: 'Critical Care',
    unit: 'ICU Alpha',
    assignedPatientIds: ['BED-04', 'BED-12', 'BED-16', 'DEMO-CRASH'],
  },
  {
    id: 'dr-arjun-kapoor',
    name: 'Dr. Arjun Kapoor',
    staffId: 'KAPOOR-ICU',
    email: 'kapoor@chronos.health',
    password: 'chronos123',
    specialty: 'Pulmonary ICU',
    unit: 'ICU Beta',
    assignedPatientIds: ['BED-09', 'BED-02', 'BED-21', 'DEMO-CRASH'],
  },
  {
    id: 'dr-maya-mehta',
    name: 'Dr. Maya Mehta',
    staffId: 'MEHTA-ICU',
    email: 'mehta@chronos.health',
    password: 'chronos123',
    specialty: 'Night Intensivist',
    unit: 'ICU Float',
    assignedPatientIds: ['BED-04', 'BED-09', 'BED-12', 'BED-02', 'BED-16', 'BED-21', 'DEMO-CRASH'],
  },
]

const mockPatients = [
  {
    patient_id: 'BED-04',
    risk_2h: 0.74,
    risk_6h: 0.61,
    risk_12h: 0.44,
    risk_delta: 0.085,
    triage_tier: 'RED',
    shap_top3: [
      { label: 'Blood Lactate', value: 4.8, direction: 'HIGH' },
      { label: 'MAP Min (last 12h)', value: 56, direction: 'LOW' },
      { label: 'Shock Index', value: 1.08, direction: 'HIGH' },
    ],
    vitals: { hr: 126, map: 58, spo2: 91, rr: 28, temp_c: 38.7 },
  },
  {
    patient_id: 'BED-09',
    risk_2h: 0.68,
    risk_6h: 0.72,
    risk_12h: 0.77,
    risk_delta: 0.064,
    triage_tier: 'RED',
    shap_top3: [
      { label: 'Vasopressor On', value: 1, direction: 'HIGH' },
      { label: 'Blood Lactate', value: 5.6, direction: 'HIGH' },
      { label: 'SOFA Change (6h)', value: 3, direction: 'HIGH' },
    ],
    vitals: { hr: 118, map: 61, spo2: 93, rr: 25, temp_c: 39.1 },
  },
  {
    patient_id: 'BED-12',
    risk_2h: 0.49,
    risk_6h: 0.58,
    risk_12h: 0.63,
    risk_delta: 0.032,
    triage_tier: 'AMBER',
    shap_top3: [
      { label: 'Respiratory Rate', value: 24, direction: 'HIGH' },
      { label: 'Oxygen Saturation', value: 92, direction: 'LOW' },
      { label: 'Heart Rate', value: 111, direction: 'HIGH' },
    ],
    vitals: { hr: 111, map: 69, spo2: 92, rr: 24, temp_c: 37.9 },
  },
  {
    patient_id: 'BED-02',
    risk_2h: 0.33,
    risk_6h: 0.41,
    risk_12h: 0.52,
    risk_delta: -0.014,
    triage_tier: 'AMBER',
    shap_top3: [
      { label: 'Creatinine', value: 1.8, direction: 'HIGH' },
      { label: 'MAP Min (last 12h)', value: 64, direction: 'LOW' },
      { label: 'White Blood Cells', value: 13.4, direction: 'HIGH' },
    ],
    vitals: { hr: 96, map: 72, spo2: 95, rr: 20, temp_c: 37.6 },
  },
  {
    patient_id: 'BED-16',
    risk_2h: 0.18,
    risk_6h: 0.21,
    risk_12h: 0.28,
    risk_delta: 0.006,
    triage_tier: 'GREEN',
    shap_top3: [
      { label: 'Heart Rate', value: 78, direction: 'NORMAL' },
      { label: 'Mean Arterial Pressure', value: 83, direction: 'NORMAL' },
      { label: 'Blood Lactate', value: 1.3, direction: 'NORMAL' },
    ],
    vitals: { hr: 78, map: 83, spo2: 97, rr: 15, temp_c: 36.8 },
  },
  {
    patient_id: 'BED-21',
    risk_2h: 0.09,
    risk_6h: 0.13,
    risk_12h: 0.2,
    risk_delta: -0.018,
    triage_tier: 'GREEN',
    shap_top3: [
      { label: 'Oxygen Saturation', value: 98, direction: 'NORMAL' },
      { label: 'Pulse Pressure', value: 42, direction: 'NORMAL' },
      { label: 'GCS Score', value: 15, direction: 'NORMAL' },
    ],
    vitals: { hr: 72, map: 86, spo2: 98, rr: 14, temp_c: 36.7 },
  },
]

const fallbackScenario = Array.from({ length: 10 }, (_, index) => {
  const t = index / 9
  const risk = 0.18 + t * 0.76
  const map = Math.round(82 - t * 38)
  const lactate = Number((1.2 + t * 5.9).toFixed(1))
  const hr = Math.round(84 + t * 48)
  return {
    patient_id: 'DEMO-CRASH',
    risk_2h: Number(risk.toFixed(2)),
    risk_6h: Number((0.12 + t * 0.62).toFixed(2)),
    risk_12h: Number((0.08 + t * 0.48).toFixed(2)),
    risk_delta: Number((0.02 + t * 0.11).toFixed(3)),
    triage_tier: risk > 0.65 ? 'RED' : risk > 0.25 ? 'AMBER' : 'GREEN',
    shap_top3: [
      { label: 'Blood Lactate', value: lactate, direction: 'HIGH' },
      { label: 'Mean Arterial Pressure', value: map, direction: 'LOW' },
      { label: 'Shock Index', value: Number((hr / Math.max(map + 32, 1)).toFixed(2)), direction: 'HIGH' },
    ],
    vitals: { hr, map, spo2: Math.round(98 - t * 9), rr: Math.round(15 + t * 15), temp_c: Number((36.8 + t * 2.2).toFixed(1)) },
  }
})

function percent(value) {
  return `${Math.round((Number(value) || 0) * 100)}%`
}

function tierForRisk(risk) {
  if (risk > 0.65) return 'RED'
  if (risk > 0.25) return 'AMBER'
  return 'GREEN'
}

function tierMeta(tier) {
  const normalized = String(tier || '').toUpperCase()
  if (normalized === 'RED') {
    return { label: 'RED', action: 'Prepare intervention - alert ICU lead', className: 'tier-red' }
  }
  if (normalized === 'AMBER') {
    return { label: 'AMBER', action: 'Notify attending', className: 'tier-amber' }
  }
  return { label: 'GREEN', action: 'Routine monitoring', className: 'tier-green' }
}

function doctorFromSession() {
  try {
    const saved = localStorage.getItem(SESSION_KEY)
    if (!saved) return null
    const session = JSON.parse(saved)
    return doctors.find((doctor) => doctor.id === session?.doctorId) || null
  } catch {
    return null
  }
}

function matchesDoctorLogin(doctor, value) {
  const normalized = value.trim().toLowerCase()
  return doctor.staffId.toLowerCase() === normalized || doctor.email.toLowerCase() === normalized
}

function patientAssignedToDoctor(patient, doctor) {
  if (!doctor || !patient) return false
  const externalDoctorFields = [
    patient.doctor_id,
    patient.doctorId,
    patient.assigned_doctor_id,
    patient.assignedDoctorId,
    patient.assigned_doctor,
    patient.assignedDoctor,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase())

  return (
    doctor.assignedPatientIds.includes(patient.patient_id) ||
    externalDoctorFields.includes(doctor.id.toLowerCase()) ||
    externalDoctorFields.includes(doctor.staffId.toLowerCase()) ||
    externalDoctorFields.includes(doctor.email.toLowerCase())
  )
}

function TriageBadge({ risk, tier }) {
  const meta = tierMeta(tier || tierForRisk(risk))
  return (
    <div className={`triage-badge ${meta.className}`}>
      <strong>{meta.label}</strong>
      <span>{meta.action}</span>
    </div>
  )
}

function TrendArrow({ delta }) {
  const value = Number(delta) || 0
  if (value > 0.05) return <span className="trend trend-up">Up +{(value * 100).toFixed(1)}%/hr</span>
  if (value < -0.05) return <span className="trend trend-down">Down {(value * 100).toFixed(1)}%/hr</span>
  return <span className="trend trend-flat">Stable</span>
}

function RiskCascade({ patient }) {
  const bars = [
    { name: '2h', value: patient.risk_2h },
    { name: '6h', value: patient.risk_6h },
    { name: '12h', value: patient.risk_12h },
  ]
  return (
    <div className="cascade" aria-label="3 horizon risk cascade">
      {bars.map((bar) => (
        <div className="bar-row" key={bar.name}>
          <span>{bar.name}</span>
          <div className="bar-track">
            <div className={`bar-fill ${tierMeta(tierForRisk(bar.value)).className}`} style={{ width: percent(bar.value) }} />
          </div>
          <strong>{percent(bar.value)}</strong>
        </div>
      ))}
    </div>
  )
}

function ShapCard({ patient }) {
  if (tierForRisk(patient.risk_2h) === 'GREEN') return null
  return (
    <section className="shap-card">
      <h3>Why high-risk?</h3>
      {patient.shap_top3.map((item) => (
        <div className="shap-row" key={`${patient.patient_id}-${item.label}`}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <em className={`direction ${String(item.direction).toLowerCase()}`}>{item.direction}</em>
        </div>
      ))}
    </section>
  )
}

function PatientCard({ patient, selected, onSelect }) {
  return (
    <button className={`patient-card ${selected ? 'selected' : ''}`} type="button" onClick={() => onSelect(patient.patient_id)}>
      <div className="patient-topline">
        <span>{patient.patient_id}</span>
        <TrendArrow delta={patient.risk_delta} />
      </div>
      <div className="risk-number">{percent(patient.risk_2h)}</div>
      <TriageBadge risk={patient.risk_2h} tier={patient.triage_tier} />
      <div className="vitals-grid">
        <span>HR <strong>{patient.vitals.hr}</strong></span>
        <span>MAP <strong>{patient.vitals.map}</strong></span>
        <span>SpO2 <strong>{patient.vitals.spo2}</strong></span>
      </div>
      <RiskCascade patient={patient} />
    </button>
  )
}

function WhatIfPanel({ patient }) {
  const [overrides, setOverrides] = useState({ map_mean: 80, hr: 90, spo2: 96 })
  const [result, setResult] = useState(null)

  useEffect(() => {
    const handle = setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE}/predict/counterfactual`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patient_id: patient.patient_id, overrides }),
        })
        if (!response.ok) throw new Error('counterfactual offline')
        setResult(await response.json())
      } catch {
        const mapGain = Math.max(0, overrides.map_mean - patient.vitals.map) * 0.008
        const oxygenGain = Math.max(0, overrides.spo2 - patient.vitals.spo2) * 0.01
        const hrPenalty = Math.abs(overrides.hr - 90) * 0.001
        const modified = Math.max(0.03, Math.min(0.98, patient.risk_2h - mapGain - oxygenGain + hrPenalty))
        setResult({ original_risk: patient.risk_2h, modified_risk: modified, delta: modified - patient.risk_2h, fallback: true })
      }
    }, 400)
    return () => clearTimeout(handle)
  }, [overrides, patient])

  const sliders = [
    { key: 'map_mean', label: 'MAP', min: 40, max: 120 },
    { key: 'hr', label: 'HR', min: 40, max: 180 },
    { key: 'spo2', label: 'SpO2', min: 80, max: 100 },
  ]

  return (
    <section className="panel">
      <h3>What-if stabilization</h3>
      {sliders.map((slider) => (
        <label className="slider-row" key={slider.key}>
          <span>{slider.label}</span>
          <input
            type="range"
            min={slider.min}
            max={slider.max}
            value={overrides[slider.key]}
            onChange={(event) => setOverrides((current) => ({ ...current, [slider.key]: Number(event.target.value) }))}
          />
          <strong>{overrides[slider.key]}</strong>
        </label>
      ))}
      <div className="whatif-result">
        Current risk: <strong>{percent(result?.original_risk ?? patient.risk_2h)}</strong>
        <span>to</span>
        <strong>{percent(result?.modified_risk ?? patient.risk_2h)}</strong>
        <em>{result ? `${result.delta <= 0 ? 'down' : 'up'} ${percent(Math.abs(result.delta))}` : 'calculating'}</em>
      </div>
    </section>
  )
}

const backdropDrops = Array.from({ length: 32 }, (_, index) => {
  const tones = ['blue', 'green', 'blue', 'amber', 'blue', 'red']
  return {
    id: index,
    delay: -((index * 0.58) % 10),
    duration: 8 + (index % 8) * 0.72,
    height: 76 + (index % 5) * 22,
    opacity: 0.18 + (index % 4) * 0.055,
    tone: tones[index % tones.length],
    x: (index * 31 + (index % 4) * 7) % 100,
  }
})

function LiveBackdrop() {
  return (
    <div className="live-backdrop" aria-hidden="true">
      {backdropDrops.map((drop) => (
        <span
          className={`falling-drop ${drop.tone}`}
          key={drop.id}
          style={{
            '--drop-delay': `${drop.delay}s`,
            '--drop-duration': `${drop.duration}s`,
            '--drop-height': `${drop.height}px`,
            '--drop-opacity': drop.opacity,
            '--drop-x': `${drop.x}%`,
          }}
        />
      ))}
    </div>
  )
}

function LoginPage({ onLogin }) {
  const [staffId, setStaffId] = useState(doctors[0].staffId)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const doctor = doctors.find((item) => matchesDoctorLogin(item, staffId))

    if (!doctor || doctor.password !== password) {
      setError('Invalid staff ID or password')
      return
    }

    setError('')
    onLogin(doctor)
  }

  return (
    <main className="app-shell login-shell">
      <LiveBackdrop />
      <div className="login-frame">
        <section className="login-copy" aria-label="Project Chronos access">
          <p>Project Chronos</p>
          <h1>Secure Gateway</h1>
          <span className="mission-line">ICU triage radar with patient access scoped by clinical assignment</span>

          <div className="command-visual" aria-hidden="true">
            <div className="command-core">
              <span />
              <i />
            </div>
            <div className="signal-stack">
              <div className="signal-row red"><strong>RED</strong><span>BED-04</span><em>74%</em></div>
              <div className="signal-row amber"><strong>AMBER</strong><span>BED-12</span><em>49%</em></div>
              <div className="signal-row green"><strong>GREEN</strong><span>BED-16</span><em>18%</em></div>
            </div>
          </div>

          <div className="summary-strip login-summary">
            <div><strong>{doctors.length}</strong><span>doctor rosters</span></div>
            <div><strong>2h</strong><span>primary risk view</span></div>
            <div><strong>6 beds</strong><span>mock ICU census</span></div>
            <div><strong>Local</strong><span>demo authentication</span></div>
          </div>
        </section>

        <form className="login-card" onSubmit={handleSubmit}>
          <div className="login-card-glow" aria-hidden="true" />
          <div className="section-head compact">
            <div>
              <p>Secure command access</p>
              <h2>Clinician login</h2>
            </div>
            <span className="login-status-chip">Online</span>
          </div>

          <label className="login-field">
            <span>Staff ID or email</span>
            <input
              autoComplete="username"
              autoFocus
              onChange={(event) => setStaffId(event.target.value)}
              placeholder="RAO-ICU"
              type="text"
              value={staffId}
            />
          </label>

          <label className="login-field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              type="password"
              value={password}
            />
          </label>

          {error ? <div className="login-error" role="alert">{error}</div> : null}

          <button className="login-submit" type="submit">Enter dashboard</button>

          <div className="doctor-switcher" aria-label="Demo doctor accounts">
            {doctors.map((doctor) => (
              <button
                className={matchesDoctorLogin(doctor, staffId) ? 'active' : ''}
                key={doctor.id}
                onClick={() => {
                  setStaffId(doctor.staffId)
                  setError('')
                }}
                type="button"
              >
                <strong>{doctor.name}</strong>
                <span>{doctor.unit} - {doctor.assignedPatientIds.length - 1} beds</span>
              </button>
            ))}
          </div>
        </form>
      </div>
    </main>
  )
}

function LoadingScreen({ doctor }) {
  return (
    <main className="app-shell loading-shell">
      <LiveBackdrop />
      <section className="loader-card" role="status" aria-live="polite">
        <div className="loader-mark" aria-hidden="true">
          <span />
        </div>
        <p>Project Chronos</p>
        <h1>Opening {doctor.unit}</h1>
        <span className="mission-line">Loading assigned patients for {doctor.name}</span>
        <div className="loader-progress" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
      </section>
    </main>
  )
}

function AlertBanner({ patient }) {
  if (!patient || tierForRisk(patient.risk_2h) !== 'RED') return null

  async function sendFeedback(action) {
    try {
      await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patient.patient_id, triage_tier: 'RED', action }),
      })
    } catch {
      localStorage.setItem(`chronos-feedback-${Date.now()}`, JSON.stringify({ patient_id: patient.patient_id, action }))
    }
  }

  return (
    <div className="alert-banner">
      <span className="alert-pulse" aria-hidden="true" />
      <strong>{patient.patient_id} - Risk {percent(patient.risk_2h)} - {patient.shap_top3[0]?.label} {patient.shap_top3[0]?.direction}</strong>
      <div>
        <button type="button" onClick={() => sendFeedback('confirm')}>Confirm</button>
        <button type="button" onClick={() => sendFeedback('false_alarm')}>False Alarm</button>
      </div>
    </div>
  )
}

function App() {
  const [currentDoctor, setCurrentDoctor] = useState(doctorFromSession)
  const [loadingDoctor, setLoadingDoctor] = useState(null)
  const [patients, setPatients] = useState(mockPatients)
  const [selectedId, setSelectedId] = useState(mockPatients[0].patient_id)
  const [source, setSource] = useState('Mock data ready')
  const [demoRunning, setDemoRunning] = useState(false)
  const [demoStep, setDemoStep] = useState(0)
  const authTimerRef = useRef(null)
  const demoTimerRef = useRef(null)

  const assignedPatients = useMemo(
    () => patients.filter((patient) => patientAssignedToDoctor(patient, currentDoctor)),
    [currentDoctor, patients],
  )
  const sortedPatients = useMemo(() => [...assignedPatients].sort((a, b) => b.risk_2h - a.risk_2h), [assignedPatients])
  const selectedPatient = sortedPatients.find((patient) => patient.patient_id === selectedId) || sortedPatients[0]

  const stopDemoTimer = useCallback(() => {
    if (demoTimerRef.current) {
      clearInterval(demoTimerRef.current)
      demoTimerRef.current = null
    }
  }, [])

  const stopAuthTimer = useCallback(() => {
    if (authTimerRef.current) {
      clearTimeout(authTimerRef.current)
      authTimerRef.current = null
    }
  }, [])

  const loadPatients = useCallback(async () => {
    if (!currentDoctor || demoRunning) return
    try {
      const response = await fetch(`${API_BASE}/patients`)
      if (!response.ok) throw new Error('API offline')
      const data = await response.json()
      setPatients(Array.isArray(data) ? data : data.patients)
      setSource('Live API connected')
    } catch {
      setPatients(mockPatients)
      setSource('Mock data fallback')
    }
  }, [currentDoctor, demoRunning])

  useEffect(() => {
    if (!currentDoctor) return undefined
    const firstLoad = setTimeout(loadPatients, 0)
    const handle = setInterval(loadPatients, 30000)
    return () => {
      clearTimeout(firstLoad)
      clearInterval(handle)
    }
  }, [currentDoctor, loadPatients])

  useEffect(() => () => {
    stopAuthTimer()
    stopDemoTimer()
  }, [stopAuthTimer, stopDemoTimer])

  function handleLogin(doctor) {
    stopAuthTimer()
    setLoadingDoctor(doctor)
    authTimerRef.current = setTimeout(() => {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ doctorId: doctor.id }))
      setCurrentDoctor(doctor)
      setPatients(mockPatients)
      setSelectedId((mockPatients.find((patient) => patientAssignedToDoctor(patient, doctor)) || mockPatients[0]).patient_id)
      setSource('Mock data ready')
      setLoadingDoctor(null)
      authTimerRef.current = null
    }, 1050)
  }

  function handleLogout() {
    stopAuthTimer()
    stopDemoTimer()
    localStorage.removeItem(SESSION_KEY)
    setCurrentDoctor(null)
    setLoadingDoctor(null)
    setDemoRunning(false)
    setDemoStep(0)
    setPatients(mockPatients)
    setSelectedId(mockPatients[0].patient_id)
    setSource('Mock data ready')
  }

  async function startDemo() {
    if (!currentDoctor) return
    stopDemoTimer()
    let scenario = fallbackScenario
    try {
      const response = await fetch('/scenario.json')
      if (response.ok) scenario = await response.json()
    } catch {
      scenario = fallbackScenario
    }
    setDemoRunning(true)
    setDemoStep(0)
    setSource('Demo replay running')
    setSelectedId(scenario[0].patient_id)
    setPatients([scenario[0], ...mockPatients.filter((patient) => patient.patient_id !== scenario[0].patient_id)])

    let index = 0
    demoTimerRef.current = setInterval(() => {
      index += 1
      if (index >= scenario.length) {
        stopDemoTimer()
        setDemoRunning(false)
        return
      }
      setDemoStep(index)
      setPatients([scenario[index], ...mockPatients.filter((patient) => patient.patient_id !== scenario[index].patient_id)])
      setSelectedId(scenario[index].patient_id)
    }, 2000)
  }

  function stopDemo() {
    stopDemoTimer()
    setDemoRunning(false)
    setDemoStep(0)
    setPatients(mockPatients)
    setSelectedId((mockPatients.find((patient) => patientAssignedToDoctor(patient, currentDoctor)) || mockPatients[0]).patient_id)
    setSource('Mock data fallback')
  }

  if (loadingDoctor) {
    return <LoadingScreen doctor={loadingDoctor} />
  }

  if (!currentDoctor) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <main className={`app-shell ${demoRunning ? 'demo-mode' : ''}`}>
      <LiveBackdrop />
      <AlertBanner patient={selectedPatient} />
      <header className="topbar">
        <div>
          <p>Project Chronos</p>
          <h1>ICU Triage Radar</h1>
          <span className="mission-line">Predictive stability engine for 2h, 6h, and 12h risk windows</span>
        </div>
        <div className="top-actions">
          <span className="doctor-chip">
            <strong>{currentDoctor.name}</strong>
            <span>{currentDoctor.unit}</span>
          </span>
          <span className="source-chip"><i aria-hidden="true" />{source}</span>
          <button type="button" onClick={demoRunning ? stopDemo : startDemo}>
            {demoRunning ? `Stop Demo (${demoStep + 1}/10)` : 'Start Demo'}
          </button>
          <button className="secondary-action" type="button" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <section className="summary-strip">
        <div><strong>{sortedPatients.length}</strong><span>assigned patients</span></div>
        <div><strong>{sortedPatients.filter((patient) => tierForRisk(patient.risk_2h) === 'RED').length}</strong><span>critical</span></div>
        <div><strong>2h / 6h / 12h</strong><span>risk cascade</span></div>
        <div><strong>{currentDoctor.unit}</strong><span>{currentDoctor.specialty}</span></div>
      </section>

      <div className="dashboard-grid">
        <section className="patient-board" aria-label="Patients sorted by 2 hour risk">
          <div className="section-head">
            <div>
              <p>Assigned census</p>
              <h2>Ranked by 2h crash risk</h2>
            </div>
            <span>Auto-refresh 30s</span>
          </div>
          <div className="patient-list">
            {sortedPatients.length ? (
              sortedPatients.map((patient) => (
                <PatientCard
                  key={patient.patient_id}
                  onSelect={setSelectedId}
                  patient={patient}
                  selected={patient.patient_id === selectedPatient?.patient_id}
                />
              ))
            ) : (
              <div className="empty-state">No assigned patients were found for this doctor.</div>
            )}
          </div>
        </section>

        <aside className="detail-pane">
          <div className="section-head compact">
            <div>
              <p>Selected bed</p>
              <h2>Clinical view</h2>
            </div>
          </div>
          {selectedPatient ? (
            <>
              <div className="detail-header">
                <span>{selectedPatient.patient_id}</span>
                <div className="risk-number">{percent(selectedPatient.risk_2h)}</div>
                <TriageBadge risk={selectedPatient.risk_2h} tier={selectedPatient.triage_tier} />
              </div>
              <section className="panel">
                <h3>3-horizon cascade</h3>
                <RiskCascade patient={selectedPatient} />
              </section>
              <ShapCard patient={selectedPatient} />
              <WhatIfPanel patient={selectedPatient} />
            </>
          ) : (
            <div className="empty-state detail-empty">Select an assigned patient to review diagnosis signals.</div>
          )}
        </aside>
      </div>
    </main>
  )
}

export default App
