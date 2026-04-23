import React from 'react';
import { useStore } from '../store/useStore';
import { History as HistoryIcon, Clock, Box } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function History() {
  const { history, user } = useStore();

  if (!user) {
    return (
      <div className="flex-col items-center mt-4 text-center">
        <h2 className="gradient-text mb-4">User History</h2>
        <p className="text-secondary mb-4">Please log in to view your activity history.</p>
        <Link to="/login" className="btn btn-primary">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="flex-col items-center mt-4">
      <h2 className="gradient-text mb-4 flex items-center gap-2">
        <HistoryIcon size={32} /> Your Activity History
      </h2>
      
      <div className="glass-panel" style={{ maxWidth: '800px', width: '100%' }}>
        {history.length === 0 ? (
          <p className="text-secondary text-center py-4">No activity recorded yet. Head over to the <Link to="/upload">Upload</Link> page to view some models!</p>
        ) : (
          <div className="flex-col gap-4">
            {history.map((log) => (
              <div key={log.id} className="flex justify-between items-center glass-panel" style={{ padding: '1rem', background: 'var(--bg-secondary)'}}>
                <div className="flex items-center gap-4">
                  <div style={{ background: 'var(--bg-primary)', padding: '0.8rem', borderRadius: '50%' }}>
                    <Box size={20} color="var(--accent)" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, marginBottom: '0.2rem' }}>{log.fileName}</h4>
                    <p className="text-secondary text-sm" style={{margin: 0}}>{log.action}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-secondary">
                  <Clock size={14} />
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
