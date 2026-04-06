import { useState, useEffect } from 'react';
import axios from 'axios';
import { Copy, Loader2, Star, Check, ShieldAlert, X } from 'lucide-react';
import './index.css';

import deathBush from './assets/death_bush.png';
import tree3 from './assets/tree_3.png';

// Importing frames (0.png to 11.png)
const frames = Array.from({ length: 12 }, (_, i) => {
  return new URL(`./assets/${i}.png`, import.meta.url).href;
});

declare global {
  interface Window {
    Razorpay: any;
  }
}

function App() {
  const [loading, setLoading] = useState(false);
  const [premiumKey, setPremiumKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [bypassLoading, setBypassLoading] = useState(false);

  // Handle Sprite Frame Animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % 12);
    }, 80); // Adjust speed (80ms per frame)
    return () => clearInterval(interval);
  }, []);

  const handleAdminBypass = async (e: React.FormEvent) => {
    e.preventDefault();
    setBypassLoading(true);
    setError(null);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await axios.post(`${baseUrl}/api/admin/generate-key`, {
        adminPassword: adminPassword
      });

      if (response.data.success) {
        setPremiumKey(response.data.key);
        setShowPasswordPrompt(false);
        setIsAdmin(true);
      }
    } catch (err: any) {
      console.error('Admin bypass failed:', err);
      setError(err.response?.data?.message || 'The path remains blocked.');
    } finally {
      setBypassLoading(false);
      setAdminPassword('');
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const { data: order } = await axios.post(`${baseUrl}/api/create-order`);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mock_id',
        amount: order.amount,
        currency: order.currency,
        name: "Forgetful Premium",
        description: "Unlock the Full Memory",
        order_id: order.id,
        handler: async function (response: any) {
          try {
            const verificationResponse = await axios.post(`${baseUrl}/api/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verificationResponse.data.success) {
              setPremiumKey(verificationResponse.data.key);
            }
          } catch (err) {
            console.error('Payment verification failed:', err);
            setError('The memory faded... Verification failed.');
          }
        },
        prefill: {
          name: "Wanderer",
          email: "wanderer@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#2d1b2d"
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response: any) {
        setError(`The path is blocked: ${response.error.description}`);
      });

      rzp1.open();
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Cannot reach the other side. Is the server online?');
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

  return (
    <>
      <div className="bg-glow">
        <div className="stars"></div>
        <div className="clouds"></div>
        <div className="ground-sphere"></div>
        
        {/* Abstract Elements */}
        <div className="abstract-container">
          <div className="fragment fragment-1"></div>
          <div className="fragment fragment-2"></div>
          <div className="fragment fragment-3"></div>
        </div>

        {/* Environment Assets */}
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
        <div className="card">
          <div className="moon-glow"></div>
          
          <h1>Forgetful</h1>
          <p>unlock full game</p>
          
          {premiumKey ? (
            <div className="success-box">
              <h3 style={{ fontFamily: 'Indie Flower', fontSize: '2rem', margin: '0 0 1rem 0' }}>Memory Restored</h3>
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Your unique activation key:</p>
              
              <div className="key-display">
                <span>{premiumKey}</span>
                <button className="copy-btn" onClick={copyToClipboard}>
                  {copied ? <Check size={20} color="#e5d0e5" /> : <Copy size={20} color="#e5d0e5" />}
                </button>
              </div>
              
              <p style={{ fontSize: '1rem', fontStyle: 'italic', opacity: 0.7 }}>
                Whisper this code in the game settings...
              </p>
            </div>
          ) : (
            <div>
              <button onClick={handlePayment} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={24} className="animate-spin" style={{ marginRight: '10px' }} />
                    Searching...
                  </>
                ) : (
                  <>
                    Unlock Full Version - <span className="original-price">₹499</span> ₹200
                  </>
                )}
              </button>

              <div className="payment-methods">
                UPI • Cards • QR Code
              </div>

              {error && <div className="error-msg">{error}</div>}
            </div>
          )}
        </div>
        
        {/* Simplified Admin Access Button */}
        {!premiumKey && (
          <button 
            className="admin-access-btn" 
            onClick={() => setShowPasswordPrompt(true)}
            title="Admin Access"
          >
            <ShieldAlert size={20} />
          </button>
        )}
      </div>

      {/* Admin Password Prompt Modal */}
      {showPasswordPrompt && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <button className="close-modal" onClick={() => setShowPasswordPrompt(false)}>
              <X size={20} />
            </button>
            <div className="admin-icon">
              <ShieldAlert size={40} color="#ff4d4d" />
            </div>
            <h2>Admin Access</h2>
            <p>Speak the secret word to manifest the key...</p>
            <form onSubmit={handleAdminBypass}>
              <input 
                type="password" 
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password..."
                autoFocus
              />
              <button type="submit" disabled={bypassLoading}>
                {bypassLoading ? <Loader2 className="animate-spin" /> : "Manifest Key"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
