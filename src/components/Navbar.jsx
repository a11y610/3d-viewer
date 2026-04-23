import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Box, Sun, Moon, LogIn, LogOut, History } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export default function Navbar() {
  const { theme, toggleTheme, user } = useStore();

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      } else {
        useStore.getState().setUser(null); // mock fallback
      }
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <nav>
      <Link to="/" className="nav-brand">
        <Box color="var(--accent)" />
        Nexus<span>3D</span>
      </Link>
      <div className="nav-links">
        <Link to="/upload">Upload</Link>
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>
        
        {user ? (
          <>
            <Link to="/history" className="flex items-center gap-2" style={{color: 'var(--text-primary)'}}>
              <History size={18} /> History
            </Link>
            <button onClick={handleLogout} className="btn" style={{ padding: '0.4rem 0.8rem' }}>
              <LogOut size={18} /> Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem' }}>
            <LogIn size={18} /> Sign In
          </Link>
        )}
        
        <button onClick={toggleTheme} className="btn" style={{ padding: '0.4rem', border: 'none' }} title="Toggle Theme">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </nav>
  );
}
