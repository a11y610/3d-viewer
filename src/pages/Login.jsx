import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useStore } from '../store/useStore';
import { LogIn, UserPlus, Rocket } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const setUser = useStore((state) => state.setUser);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (auth) {
      try {
        if (isLogin) {
          await signInWithEmailAndPassword(auth, email, password);
        } else {
          await createUserWithEmailAndPassword(auth, email, password);
        }
        navigate('/upload');
      } catch (err) {
        setError(err.message);
      }
    } else {
      // Mock Auth Fallback
      setUser({ uid: 'mock-123', email });
      navigate('/upload');
    }
  };

  return (
    <div className="flex justify-center items-center" style={{ minHeight: '60vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 className="text-center mb-4 flex items-center justify-center gap-2" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          <Rocket size={24} color="var(--accent)" />
          {isLogin ? 'Authentication' : 'Registration'}
        </h2>
        {error && <p style={{ color: '#ff4444', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>}
        
        <form onSubmit={handleSubmit} className="flex-col">
          <input 
            type="email" 
            placeholder="Comm Channel (Email Address)" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          <input 
            type="password" 
            placeholder="Security Code (Password)" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          
          <button type="submit" className="btn btn-primary mt-4" style={{ width: '100%' }}>
            {isLogin ? <><LogIn size={18} /> Initialize Login</> : <><UserPlus size={18} /> Establish Identity</>}
          </button>
        </form>
        
        <p className="text-center mt-4 text-sm">
          {isLogin ? "No identity recorded? " : "Identity already established? "}
          <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); }}>
            {isLogin ? 'Register Now' : 'Login'}
          </a>
        </p>
      </div>
    </div>
  );
}
