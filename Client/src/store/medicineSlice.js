import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userMedicines: [], 
};

const medicineSlice = createSlice({
  name: "medicine",
  initialState,
  reducers: {
    addMedicine: (state, action) => {
      // Push new medicine into array
      state.userMedicines.push(action.payload);
    },
    setMedicines: (state, action) => {
     // this is for fetching the whole medicine from the backend
      state.userMedicines = action.payload;
    },
  },
});

export const { addMedicine, setMedicines } = medicineSlice.actions;
export default medicineSlice.reducer;
