import { useState, useEffect } from 'react';
import axios from 'axios';
import { Copy, Loader2, Check, ShieldAlert, X, Monitor, Smartphone, Key } from 'lucide-react';
import './index.css';

import deathBush from './assets/death_bush.png';
import tree3 from './assets/tree_3.png';

// Importing frames (0.png to 11.png)
const frames = Array.from({ length: 12 }, (_, i) => {
  return new URL(`./assets/${i}.png`, import.meta.url).href;
});

function App() {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  // Handle Sprite Frame Animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % 12);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Simple routing listener
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleLocationChange);
    return () => window.removeEventListener('hashchange', handleLocationChange);
  }, []);

  const isAdminPath = currentHash.toLowerCase().includes('#admin');

  return (
    <>
      <div className="bg-glow">
        <div className="stars"></div>
        <div className="clouds"></div>
        <div className="ground-sphere"></div>
        
        <div className="abstract-container">
          <div className="fragment fragment-1"></div>
          <div className="fragment fragment-2"></div>
          <div className="fragment fragment-3"></div>
        </div>

        <img src={tree3} className="ground-asset tree-left" alt="tree" />
        <img src={deathBush} className="ground-asset bush-center" alt="bush" />
        <img src={tree3} className="ground-asset tree-right" alt="tree" />

        <div className="player-container">
          <div className="player-character">
             <img src={frames[currentFrame]} alt="running character" />
          </div>
        </div>
      </div>

      <div className="App">
        {isAdminPath ? <AdminPage /> : <HomePage />}
      </div>
    </>
  );
}

function HomePage() {
  const pcLink = import.meta.env.VITE_PC_LINK || '#';
  const androidLink = import.meta.env.VITE_ANDROID_LINK || '#';

  return (
    <div className="card">
      <div className="moon-glow"></div>
      <h1>Forgetful</h1>
      <p>restore the memory</p>

      <div className="download-options">
        <a href={pcLink} className="sketchy-link-btn" target="_blank" rel="noopener noreferrer">
          <Monitor size={24} />
          <span>PC VERSION</span>
        </a>
        <a href={androidLink} className="sketchy-link-btn" target="_blank" rel="noopener noreferrer">
          <Smartphone size={24} />
          <span>ANDROID VERSION</span>
        </a>
      </div>

      <div className="footer-note">
        Requires activation key to play
      </div>
    </div>
  );
}

function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [premiumKey, setPremiumKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'forgetful') {
      setIsAuthorized(true);
      setError(null);
    } else {
      setError('The memory is locked. Incorrect word.');
    }
  };

  const generateKey = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await axios.post(`${baseUrl}/api/admin/generate-key`, {
        adminPassword: password
      });

      if (response.data.success) {
        setPremiumKey(response.data.key);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Connection to the void lost.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (premiumKey) {
      navigator.clipboard.writeText(premiumKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="card admin-card">
        <div className="admin-icon-container">
          <ShieldAlert size={48} color="#ff4d4d" />
        </div>
        <h2>Admin Portal</h2>
        <p style={{ fontSize: '1.8rem' }}>speak the secret word...</p>
        <form onSubmit={handleLogin} className="admin-form">
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Secret word..."
            autoFocus
          />
          <button type="submit">Unlock Path</button>
        </form>
        {error && <div className="error-msg">{error}</div>}
      </div>
    );
  }

  return (
    <div className="card admin-card">
      <div className="admin-icon-container">
        <Key size={48} color="#e5d0e5" />
      </div>
      <h2>Manifest Key</h2>
      <p style={{ fontSize: '1.8rem' }}>forge a new memory fragment</p>

      {premiumKey ? (
        <div className="success-box">
          <div className="key-display">
            <span>{premiumKey}</span>
            <button className="copy-btn" onClick={copyToClipboard}>
              {copied ? <Check size={20} color="#e5d0e5" /> : <Copy size={20} color="#e5d0e5" />}
            </button>
          </div>
          <button onClick={() => setPremiumKey(null)} className="secondary-btn">Generate Another</button>
        </div>
      ) : (
        <button onClick={generateKey} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : "Manifest Key"}
        </button>
      )}

      {error && <div className="error-msg">{error}</div>}
      
      <div style={{ marginTop: '2rem' }}>
        <button onClick={() => setIsAuthorized(false)} className="close-btn">
          <X size={20} /> Close Portal
        </button>
      </div>
    </div>
  );
}

export default App;
