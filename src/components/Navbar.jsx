import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Telescope, Sun, Moon, LogIn, LogOut, History, Star } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export default function Navbar() {
  const { theme, toggleTheme, user } = useStore();

  const handleLogout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      } else {
        useStore.getState().setUser(null);
      }
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <nav>
      <Link to="/" className="nav-brand">
        <Telescope color="var(--accent)" size={22} />
        Nexus<span>3D</span>
        <Star size={10} color="var(--accent-gold)" fill="var(--accent-gold)" style={{ marginLeft: '-4px', marginBottom: '10px' }} />
      </Link>

      <div className="nav-links">
        <Link to="/upload">Upload</Link>
        <Link to="/about">About</Link>
        <Link to="/contact">Contact</Link>

        {user ? (
          <>
            <Link to="/history" className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <History size={16} /> History
            </Link>
            <button onClick={handleLogout} className="btn" style={{ padding: '0.4rem 0.8rem' }}>
              <LogOut size={16} /> Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary" style={{ padding: '0.4rem 0.9rem' }}>
            <LogIn size={16} /> Sign In
          </Link>
        )}

        <button
          onClick={toggleTheme}
          className="btn"
          style={{ padding: '0.4rem', border: 'none' }}
          title="Toggle Cosmic Mode"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </nav>
  );
}
