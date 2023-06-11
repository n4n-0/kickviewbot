import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';

import './styles/app.scss';
import 'react-toastify/dist/ReactToastify.css';

const TOAST_SETTINGS = {
  position: "bottom-right",
  autoClose: 5000,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "dark",
};

function isValidUrl(url) {
  return url && url.includes('kick.com');
}

async function apiRequest(endpoint, data = {}) {
  try {
    const response = await axios.post(`http://localhost:3000${endpoint}`, data);
    return response;
  } catch (error) {
    console.error(error);
  }
}

function App() {
  const [config, setConfig] = useState({
    url: '',
    numOfBrowsers: 1,
    headless: true
  });
  const [botRunning, setBotRunning] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await axios.get('http://localhost:3000/status');
        setBotRunning(response.data.botRunning);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setConfig({
      ...config,
      [e.target.name]: value
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!isValidUrl(config.url)) {
      toast("❌ Invalid URL. Ensure it is not empty and contains 'kick.com'");
      return;
    }

    toast('🚀 Settings Updated', TOAST_SETTINGS);
  };

  const updateSettings = async () => {
    await apiRequest('/update', config);
  }

  const startStopBot = async () => {
    const endpoint = botRunning ? '/stop' : '/start';
    const data = botRunning ? {} : config;
    await apiRequest(endpoint, data);
    setBotRunning(!botRunning);
  }

  return (
    <div className="App">
      <h1>Kick View Bot</h1>
      <form onSubmit={handleSubmit}>
        <div name="url-input">
          <label htmlFor="url">URL: </label>
          <input name="url" value={config.url} onChange={handleChange} />
        </div>
        <div name="browser-slider">
          <label htmlFor="numOfBrowsers">Number of Browsers:</label>
          <input name="numOfBrowsers" type="range" min="1" max="100" value={config.numOfBrowsers} onChange={handleChange} />
          <span>{config.numOfBrowsers}</span>
        </div>
        <div>
          <label htmlFor="headless">Headless:</label>
          <input name="headless" type="checkbox" checked={config.headless} onChange={handleChange} />
        </div>
        <div name="button-area">
          <button type="button" onClick={updateSettings}>Update Settings</button>
          <button type="button" onClick={startStopBot}>
            {botRunning ? 'Stop Bot' : 'Start Bot'}
          </button>
        </div>
      </form>
      <ToastContainer {...TOAST_SETTINGS} />
    </div>
  );
}

export default App;
