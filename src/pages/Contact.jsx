import { Send, MessageSquare } from 'lucide-react';

export default function Contact() {
  return (
    <div className="flex-col items-center mt-4">
      <h2 className="gradient-text mb-4 flex items-center gap-3 justify-center" style={{ fontFamily: "'Orbitron', sans-serif" }}>
        <MessageSquare size={32} color="var(--accent)" />
        Transmission
      </h2>
      <div className="glass-panel" style={{ maxWidth: '600px', width: '100%' }}>
        <form className="flex-col gap-4">
          <div>
            <label className="text-sm mb-2" style={{ display: 'block', color: 'var(--text-secondary)' }}>Designation (Name)</label>
            <input type="text" placeholder="Commander Shepard" />
          </div>
          <div>
            <label className="text-sm mb-2" style={{ display: 'block', color: 'var(--text-secondary)' }}>Comm Channel (Email)</label>
            <input type="email" placeholder="shepard@normandy.space" />
          </div>
          <div>
            <label className="text-sm mb-2" style={{ display: 'block', color: 'var(--text-secondary)' }}>Message Array</label>
            <textarea placeholder="Transmit your inquiry here..." rows={5}></textarea>
          </div>
          <button type="button" className="btn btn-primary" style={{ width: '100%' }}>
            <Send size={18} /> Send Transmission
          </button>
        </form>
      </div>
    </div>
  );
}
