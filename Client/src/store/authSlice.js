import {createSlice} from '@reduxjs/toolkit';

const initialState = {
    status: false,
    userData: null
}
const authSlice = createSlice({ 
    name: 'auth',
    initialState,
    reducers:{
        login: (state, action) => {
            state.status = true; // ap logged in ho gye
            state.userData = action.payload
        },
        logout: (state) => {
            state.status = false; // ap logged out ho gye
            state.userData = null
        },
        updateCharacter: (state, action) => {
            if (state.userData) {
                state.userData.circusCharacter = action.payload;
            }
        },

    }
});

export const {login, logout,updateCharacter} = authSlice.actions; 

export default authSlice.reducer; 