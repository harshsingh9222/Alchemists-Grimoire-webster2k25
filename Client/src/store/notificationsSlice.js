import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchUpcomingRisks } from '../api'

export const loadUpcomingRisks = createAsyncThunk('notifications/loadUpcomingRisks', async () => {
  const res = await fetchUpcomingRisks()
  return res.risks || []
})

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: { risks: [], loading: false },
  reducers: {
    clearRisks: (state) => { state.risks = [] },
    dismissRisk: (state, action) => { state.risks = state.risks.filter(r => String(r.doseId) !== String(action.payload)) }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUpcomingRisks.pending, (s) => { s.loading = true })
      .addCase(loadUpcomingRisks.fulfilled, (s, a) => {
        s.loading = false;
        const incoming = Array.isArray(a.payload) ? a.payload : [];
        // Keep existing risks until user acts; only append truly new ones (dedupe by doseId)
        const existing = Array.isArray(s.risks) ? s.risks : [];
        const existingIds = new Set(existing.map(r => String(r.doseId)));
        const newOnes = incoming.filter(r => !existingIds.has(String(r.doseId)));
        s.risks = existing.concat(newOnes);
      })
      .addCase(loadUpcomingRisks.rejected, (s) => { s.loading = false; /* keep existing risks on error */ })
  }
})

export const { clearRisks, dismissRisk } = notificationsSlice.actions
export default notificationsSlice.reducer
