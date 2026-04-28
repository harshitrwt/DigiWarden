import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Lock, AlertTriangle, Fingerprint, Image as ImageIcon, ArrowRight } from 'lucide-react';

export default function VaultPage({ navigate }) {
  const [vaultItems, setVaultItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { token, logout, email } = useAuth();

  useEffect(() => {
    if (!token) {
      navigate('login');
      return;
    }

    const fetchVault = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/users/me/vault', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.status === 401) {
          logout();
          navigate('login');
          return;
        }
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Failed to fetch vault');
        
        setVaultItems(data.data.vault);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVault();
  }, [token, navigate, logout]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-500">
            <Shield className="w-6 h-6" />
            <span className="font-bold text-xl tracking-tight text-white">DigiWarden Vault</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{email}</span>
            <button 
              onClick={logout}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
            <button 
              onClick={() => navigate('landing')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Register New Asset
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Your Protected Assets</h1>
            <p className="text-slate-400">Manage your intellectual property and track infringements.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg mb-8">
            {error}
          </div>
        )}

        {vaultItems.length === 0 && !error ? (
          <div className="text-center py-20 bg-slate-800/50 rounded-2xl border border-slate-700 border-dashed">
            <ImageIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Your vault is empty</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">Upload and register your first image to begin tracking and protecting your intellectual property across the web.</p>
            <button 
              onClick={() => navigate('landing')}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Fingerprint className="w-5 h-5" />
              Register an Asset
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vaultItems.map((item) => (
              <div key={item.image_id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-colors group">
                <div className="h-48 bg-slate-900 relative overflow-hidden">
                  <img 
                    src={`http://localhost:8000/assets/${item.image_id}.jpg`}
                    alt={item.filename}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                    <span className="text-sm font-medium text-white truncate max-w-[70%]">{item.filename}</span>
                    <span className="text-xs text-slate-400 bg-slate-900/80 px-2 py-1 rounded backdrop-blur-sm">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center relative">
                      <div className="absolute inset-0 border-2 border-green-500/20 rounded-full" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${item.integrity_score}%, 0 ${item.integrity_score}%)` }}></div>
                      <Shield className="w-5 h-5 text-slate-400 z-10" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Integrity Score</div>
                      <div className="font-mono text-sm text-green-400">{item.integrity_score}%</div>
                    </div>
                  </div>
                  
                  {item.infringing_copies > 0 && (
                    <div className="flex items-center gap-1.5 text-red-400 bg-red-400/10 px-2 py-1 rounded text-xs font-medium border border-red-400/20">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {item.infringing_copies} Infringements
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-slate-800/50 flex justify-between items-center">
                  <div className="text-xs text-slate-400">
                    {item.total_copies} total copies found
                  </div>
                  <button 
                    onClick={() => navigate('dashboard', { analysis: { image_id: item.image_id } })}
                    className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    View Analysis <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
