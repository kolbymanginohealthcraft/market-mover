import React from 'react'
import ReactDOM from 'react-dom/client'
import App from "./App.jsx";
import { BrowserRouter } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './base.css'; // ✅ Make sure this is here
import '../components/Buttons/buttons.css'; // ✅ import it here instead


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
