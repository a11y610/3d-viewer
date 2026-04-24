import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { useStore } from './store/useStore';
import Navbar from './components/Navbar';
import StarCanvas from './components/StarCanvas';

import Home from './pages/Home';
import Upload from './pages/Upload';
import History from './pages/History';
import Login from './pages/Login';
import About from './pages/About';
import Contact from './pages/Contact';

function App() {
  const { theme, setUser } = useStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Firebase auth state listener
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({ uid: user.uid, email: user.email });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, [setUser]);

  return (
    <Router>
      {/* Cosmic animated star-field (nakshtras) — sits behind everything */}
      <StarCanvas />

      <Navbar />
      <main className="container" style={{ marginTop: '2rem', paddingBottom: '3rem', position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/"        element={<Home />} />
          <Route path="/upload"  element={<Upload />} />
          <Route path="/history" element={<History />} />
          <Route path="/login"   element={<Login />} />
          <Route path="/about"   element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
