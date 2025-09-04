import React from 'react'
import ReactDOM from 'react-dom/client'
import App from "./App.jsx";
import { BrowserRouter } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './base.css'; // ✅ Make sure this is here
import './globalSearchBehavior.js'; // Global search behavior for all search inputs


ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
