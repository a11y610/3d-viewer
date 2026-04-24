import React from 'react';
import { useStore } from '../store/useStore';
import { Orbit, Clock, Star, History as HistoryIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function History() {
  const { history, user } = useStore();

  if (!user) {
    return (
      <div className="flex-col items-center mt-4 text-center">
        <h2 className="gradient-text mb-4" style={{ fontFamily: "'Orbitron', sans-serif" }}>Constellation Log</h2>
        <p className="text-secondary mb-4">Please log in to access your stellar activity history.</p>
        <Link to="/login" className="btn btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="flex-col items-center mt-4">
      <h2 className="gradient-text mb-4 flex items-center gap-3" style={{ fontFamily: "'Orbitron', sans-serif" }}>
        <HistoryIcon size={32} color="var(--accent)" /> 
        Activity Constellation
      </h2>
      
      <div className="glass-panel" style={{ maxWidth: '800px', width: '100%' }}>
        {history.length === 0 ? (
          <p className="text-secondary text-center py-4">No stellar events recorded yet. Head over to the <Link to="/upload">Upload</Link> portal to view some models!</p>
        ) : (
          <div className="flex-col gap-4">
            {history.map((log) => (
              <div key={log.id} className="flex justify-between items-center glass-panel" style={{ padding: '1rem', background: 'var(--bg-secondary)'}}>
                <div className="flex items-center gap-4">
                  <div style={{ background: 'var(--bg-primary)', padding: '0.8rem', borderRadius: '50%', boxShadow: '0 0 15px rgba(200, 164, 255, 0.1)' }}>
                    <Orbit size={20} color="var(--accent)" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, marginBottom: '0.2rem', fontFamily: "'Orbitron', sans-serif", fontSize: '1rem', color: 'var(--text-primary)' }}>{log.fileName}</h4>
                    <p className="text-secondary text-sm" style={{margin: 0}}>{log.action}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-secondary">
                  <Clock size={14} color="var(--accent-secondary)" />
                  <span>{log.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
