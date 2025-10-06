import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import medicineReducer from './medicineSlice';
import dashboardReducer from './dashboardSlice';


export const store = configureStore({
    reducer:{
        auth:authReducer,
        dashboard: dashboardReducer,
        medicine: medicineReducer,
    },
})