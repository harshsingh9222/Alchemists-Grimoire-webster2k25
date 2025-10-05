import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
// import AuthProvider from './context/AuthProvider.jsx'
// import { GoogleOAuthProvider } from '@react-oauth/google';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux'
import {store} from "./store/store.js";
import { GoogleOAuthProvider } from '@react-oauth/google'


ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
  <GoogleOAuthProvider clientId="576465356327-501k2vs4bv48ibc54f4c4519j8gitj9g.apps.googleusercontent.com">
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
     </GoogleOAuthProvider> 
  </StrictMode>
);

