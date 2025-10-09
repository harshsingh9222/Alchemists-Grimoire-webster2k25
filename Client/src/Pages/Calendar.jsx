import React, { useEffect, useState } from 'react'
import { getCalendarEvents } from '../api'
import { toast } from 'react-hot-toast'

// Helper functions (same as your previous code)
function startOfMonth(year, month) {
  return new Date(year, month - 1, 1)
}

function endOfMonth(year, month) {
  return new Date(year, month, 0)
}

function generateMonthGrid(year, month) {
  const start = startOfMonth(year, month)
  const end = endOfMonth(year, month)
  const startDay = start.getDay()
  const daysInMonth = end.getDate()
  const cells = []
  const prevMonthDays = startDay
  const prevMonthLastDate = new Date(year, month - 1, 0).getDate()
  for (let i = prevMonthDays - 1; i >= 0; i--) {
    const day = prevMonthLastDate - i
    const date = new Date(year, month - 2, day)
    cells.push({ key: `p-${day}`, label: day, date, isCurrentMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d)
    cells.push({ key: `c-${d}`, label: d, date, isCurrentMonth: true })
  }
  while (cells.length % 7 !== 0) {
    const nextDay = cells.length - (prevMonthDays + daysInMonth) + 1
    const date = new Date(year, month, nextDay)
    cells.push({ key: `n-${nextDay}`, label: date.getDate(), date, isCurrentMonth: false })
  }
  return cells
}

function eventsForDate(events, date) {
  if (!events || events.length === 0) return []
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
  return events.filter((ev) => {
    const start = ev.start?.dateTime ? new Date(ev.start.dateTime) : ev.start?.date ? new Date(ev.start.date) : null
    if (!start) return false
    return start >= dayStart && start < dayEnd
  })
}

function formatEventTime(ev) {
  const start = ev.start?.dateTime ? new Date(ev.start.dateTime) : ev.start?.date ? new Date(ev.start.date) : null
  const end = ev.end?.dateTime ? new Date(ev.end.dateTime) : ev.end?.date ? new Date(ev.end.date) : null
  if (!start) return ''
  if (!ev.start?.dateTime && ev.start?.date) return 'All day'
  const opts = { hour: '2-digit', minute: '2-digit' }
  try {
    return `${start.toLocaleTimeString([], opts)}${end ? ` - ${end.toLocaleTimeString([], opts)}` : ''}`
  } catch (e) {
    return ''
  }
}

const CalendarPage = () => {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)

  useEffect(() => {
    fetchEvents()
    // eslint-disable-next-line
  }, [year, month])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const res = await getCalendarEvents(year, month)
      setEvents(res.events || res.data?.events || [])
    } catch (err) {
      toast.error('Failed to fetch calendar events')
    }
    setLoading(false)
  }

  // Custom star component for background
  const Star = ({ top, left, size }) => (
    <div
      className="absolute rounded-full bg-white opacity-80"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        width: size,
        height: size,
        boxShadow: '0 0 6px 2px #fff'
      }}
    />
  )

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start overflow-x-hidden bg-gradient-to-b from-indigo-950 via-blue-900 to-purple-900">
      {/* Starry background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {[...Array(35)].map((_, i) => (
          <Star
            key={i}
            top={Math.random() * 100}
            left={Math.random() * 100}
            size={`${4 + Math.random() * 6}px`}
          />
        ))}
        {/* Some shooting stars */}
        {[...Array(4)].map((_, i) => (
          <div key={`shoot-${i}`}
            className="absolute z-0"
            style={{
              top: `${Math.random() * 90}%`,
              left: `${Math.random() * 92}%`,
              width: '48px',
              height: '2px',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.05) 100%)',
              borderRadius: '1px',
              transform: `rotate(${Math.random() * 60 - 30}deg)`
            }}
          />
        ))}
      </div>

      {/* Calendar content */}
      <div className="relative z-10 max-w-4xl mx-auto mt-12 bg-gray-900 bg-opacity-75 rounded-xl shadow-xl p-8 ring-1 ring-indigo-800 text-white">
        <h1 className="text-3xl font-bold mb-6 text-center text-white drop-shadow-lg">
          Starry Calendar - {month}/{year}
        </h1>
        <div className="flex items-center gap-4 mb-6 justify-center">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="p-2 border rounded bg-indigo-900 bg-opacity-40 text-white focus:outline-none ring-1 ring-indigo-700">
            {[...Array(12)].map((_, i) => (
              <option key={i} value={i + 1}>{i + 1}</option>
            ))}
          </select>
          <input type="number"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="p-2 border rounded w-20 bg-indigo-900 bg-opacity-40 text-white focus:outline-none ring-1 ring-indigo-700"
          />
          <button
            onClick={fetchEvents}
            className="px-4 py-2 bg-gradient-to-r from-indigo-700 to-purple-700 text-white font-semibold rounded shadow hover:scale-105 transition">
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-center mt-6 text-white">Loading...</p>
        ) : (
          <div>
            {events.length === 0 ? (
              <p className="text-center text-gray-300">No events for this month.</p>
            ) : (
              // Month grid with subtle glass effect
              <div className="grid grid-cols-7 gap-4 bg-gray-800 bg-opacity-30 p-4 rounded-lg shadow-inner">
                {generateMonthGrid(year, month).map((cell) => (
                  <div key={cell.key}
                    className={`relative p-3 border rounded min-h-[80px] transition-shadow duration-150
                      ${cell.isCurrentMonth
                        ? 'bg-gray-800 bg-opacity-60 shadow-inner'
                        : 'bg-gray-700 text-gray-400 opacity-80'}
                      hover:shadow-lg`}>
                    <div className="flex items-start justify-between">
                      <div className="text-xs font-semibold text-white">{cell.label}</div>
                    </div>
                    <div className="mt-2 text-xs space-y-1">
                      {(eventsForDate(events, cell.date) || []).map(ev => (
                        <button key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className="w-full text-left block rounded px-1 py-0.5 hover:bg-indigo-700/20"
                          title={ev.summary || ''}>
                          <div className="text-xs text-purple-300 truncate">{ev.summary || '(No title)'}</div>
                          <div className="text-[11px] text-gray-300">{formatEventTime(ev)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Event details modal */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-gray-900 rounded-lg w-full max-w-md p-8 shadow-2xl border-2 border-indigo-700/40 relative text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {selectedEvent.summary || '(No title)'}
                  </h3>
                  <div className="text-sm text-gray-300">{selectedEvent.organizer?.email || ''}</div>
                </div>
                <button onClick={() => setSelectedEvent(null)}
                  className="text-gray-300 hover:text-white text-3xl font-bold leading-none">&times;</button>
              </div>
              <div className="mt-4 text-sm text-gray-200">
                <div className="font-semibold text-white">When</div>
                <div className="mt-1">{formatEventTime(selectedEvent)}</div>
                {selectedEvent.location && (
                  <>
                    <div className="font-semibold mt-3 text-white">Location</div>
                    <div className="mt-1">{selectedEvent.location}</div>
                  </>
                )}
                {selectedEvent.description && (
                  <>
                    <div className="font-semibold mt-3 text-white">Details</div>
                    <div className="mt-1 whitespace-pre-wrap">{selectedEvent.description}</div>
                  </>
                )}
              </div>
              <div className="mt-6 text-right">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 bg-indigo-700 text-white rounded shadow hover:scale-105 transition font-semibold">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CalendarPage
