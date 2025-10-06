// store/medicineSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchMedicines } from "../api";

// 🔹 Async thunk to fetch medicines from backend
export const fetchMedicinesThunk = createAsyncThunk(
  "medicine/fetchMedicines",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetchMedicines(); 
      return res; // medicines array
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch medicines");
    }
  }
);

const medicineSlice = createSlice({
  name: "medicine",
  initialState: {
    userMedicines: [],
    loading: false,
    error: null,
  },
  reducers: {
    // for adding medicine manually if needed
    addMedicine: (state, action) => {
      state.userMedicines.push(action.payload);
    },
    setMedicines: (state, action) => {
      state.userMedicines = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMedicinesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMedicinesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.userMedicines = action.payload; 
      })
      .addCase(fetchMedicinesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { addMedicine, setMedicines } = medicineSlice.actions;
export default medicineSlice.reducer;
