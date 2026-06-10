import { useEffect, useState } from 'react'
import './App.css'

const SAVE_SCHEDULE_URL = import.meta.env.VITE_SAVE_SCHEDULE_URL ?? ''

const HOME_HEALTH_LOCATIONS = [
  'Plano',
  'Rockwall',
  'Fort Worth',
  'Bridgeway',
  'Gun Barrel City',
  'Hillsboro',
  'Tyler',
  'Aiding',
  'Livingston, Lufkin, Nacogdoches',
  'El Paso',
]

const HOSPICE_LOCATIONS = [
  'Plano',
  'Denton',
  'Fort Worth',
  'Houston',
  'San Antonio',
  'Teague',
  'Lufkin',
  'Tyler',
  'Bayou City',
]

const BAYOU_LOCATIONS = ['Bayou']

const PRESERVE_LOCATIONS = ['Preserve']

const SERVICE_TYPES = ['Home Health', 'Hospice', 'Bayou', 'Preserve']

const LOCATIONS_BY_SERVICE_TYPE = {
  'Home Health': HOME_HEALTH_LOCATIONS,
  Hospice: HOSPICE_LOCATIONS,
  Bayou: BAYOU_LOCATIONS,
  Preserve: PRESERVE_LOCATIONS,
}

function createEmptySchedule() {
  return {
    formId: crypto.randomUUID(),
    date: '',
    serviceType: SERVICE_TYPES[0],
    location: HOME_HEALTH_LOCATIONS[0],
    onDuty: '',
  }
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('sched-theme') ?? 'light')
  const isDark = theme === 'dark'
  const [schedules, setSchedules] = useState([createEmptySchedule()])
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('sched-theme', theme)
  }, [theme])

  const updateSchedule = (formId, patch) => {
    setSchedules((current) =>
      current.map((entry) => (entry.formId === formId ? { ...entry, ...patch } : entry)),
    )
  }

  const onServiceTypeChange = (formId, nextServiceType) => {
    const nextLocation = LOCATIONS_BY_SERVICE_TYPE[nextServiceType]?.[0] ?? ''
    updateSchedule(formId, { serviceType: nextServiceType, location: nextLocation })
  }

  const addSchedule = () => {
    setSchedules((current) => [...current, createEmptySchedule()])
  }

  const saveScheduleItems = async () => {
    setLoading(true)
    setStatus('Saving...')

    try {
      if (!SAVE_SCHEDULE_URL) {
        throw new Error('Set VITE_SAVE_SCHEDULE_URL in .env')
      }

      const items = schedules.map((entry, index) => {
        if (!entry.date) {
          throw new Error(`Please select a date for schedule #${index + 1}.`)
        }

        if (!entry.onDuty.trim()) {
          throw new Error(`Please enter on duty names for schedule #${index + 1}.`)
        }

        return {
          date: entry.date,
          location: entry.location || null,
          serviceType: entry.serviceType,
          onDuty: entry.onDuty
            .split('\n')
            .map((value) => value.trim())
            .filter(Boolean),
        }
      })

      const responses = await Promise.all(
        items.map((item) =>
          fetch(SAVE_SCHEDULE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          }),
        ),
      )

      const failedResponse = responses.find((response) => !response.ok)
      if (failedResponse) {
        throw new Error(`Failed to save (${failedResponse.status})`)
      }

      setStatus(`Saved ${items.length} schedule(s).`)
      setSchedules([createEmptySchedule()])
    } catch (error) {
      setStatus(error.message ?? 'Unable to save.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <section className="card">
        <div className="card-top">
          <h1>RNOC Sched</h1>
          <div className="theme-toggle" role="group" aria-label="Theme toggle">
            <button
              type="button"
              className={`toggle-switch ${isDark ? 'dark' : ''}`}
              onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
              aria-label="Toggle day and night mode"
              disabled={loading}
            >
              <span className="toggle-thumb" />
            </button>
          </div>
        </div>
        <p className="helper">Pick a date, location, and on duty</p>

        <div className="schedule-list">
          {schedules.map((entry, index) => {
            const locations = LOCATIONS_BY_SERVICE_TYPE[entry.serviceType] ?? []
            return (
              <section key={entry.formId} className="schedule-item">
                <h2>Schedule #{index + 1}</h2>

                <div className="field">
                  <label htmlFor={`date-${entry.formId}`}>Date</label>
                  <input
                    id={`date-${entry.formId}`}
                    type="date"
                    value={entry.date}
                    onChange={(event) => updateSchedule(entry.formId, { date: event.target.value })}
                    disabled={loading}
                  />
                </div>

                <div className="field">
                  <label htmlFor={`serviceType-${entry.formId}`}>Service Type</label>
                  <select
                    id={`serviceType-${entry.formId}`}
                    value={entry.serviceType}
                    onChange={(event) => onServiceTypeChange(entry.formId, event.target.value)}
                    disabled={loading}
                  >
                    {SERVICE_TYPES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor={`location-${entry.formId}`}>Location</label>
                  <select
                    id={`location-${entry.formId}`}
                    value={entry.location}
                    onChange={(event) =>
                      updateSchedule(entry.formId, { location: event.target.value })
                    }
                    disabled={loading}
                  >
                    {locations.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor={`onDuty-${entry.formId}`}>On Duty (one per line)</label>
                  <textarea
                    id={`onDuty-${entry.formId}`}
                    rows={6}
                    value={entry.onDuty}
                    onChange={(event) =>
                      updateSchedule(entry.formId, { onDuty: event.target.value })
                    }
                    placeholder={'John Doe, LVN\nJane Doe, RN'}
                    disabled={loading}
                  />
                </div>
              </section>
            )
          })}
        </div>

        <div className="actions">
          <button type="button" className="primary" onClick={saveScheduleItems} disabled={loading}>
            Save
          </button>
        </div>

        <div className="bulk-add-wrap">
          <button type="button" className="add-schedule-btn" onClick={addSchedule} disabled={loading}>
            + Add another schedule
          </button>
        </div>
      </section>

      <footer className="meta">
        {status ? <p className="status">{status}</p> : <span />}
        <p className="copyright">© SupportZebra</p>
      </footer>
    </main>
  )
}

export default App
