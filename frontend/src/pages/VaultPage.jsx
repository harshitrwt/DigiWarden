import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, AlertTriangle, Fingerprint, Image as ImageIcon, ArrowRight, Trash2, UserX } from 'lucide-react';

export default function VaultPage({ navigate }) {
  const [vaultItems, setVaultItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  
  const { token, logout, email } = useAuth();

  const fetchVault = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/users/me/vault', {
        headers: { 'Authorization': `Bearer ${token}` }
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

  useEffect(() => {
    if (!token) {
      navigate('login');
      return;
    }
    fetchVault();
  }, [token]);

  const handleDeleteItem = async (imageId, filename) => {
    if (!confirm(`Delete "${filename}" and all its analysis data? This cannot be undone.`)) return;
    
    setDeletingId(imageId);
    try {
      const res = await fetch(`http://localhost:8000/api/users/me/vault/${imageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to delete');
      }
      setVaultItems(prev => prev.filter(item => item.image_id !== imageId));
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('PERMANENTLY delete your account and ALL your data? This cannot be undone!')) return;
    
    setDeletingAccount(true);
    try {
      const res = await fetch('http://localhost:8000/api/users/me/account', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to delete account');
      }
      logout();
      navigate('landing');
    } catch (err) {
      alert(`Error: ${err.message}`);
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <div style={{ width: 48, height: 48, border: '3px solid var(--border)', borderTopColor: 'var(--orange)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <nav style={{
        borderBottom: '1px solid var(--border)', background: 'rgba(10,10,10,0.5)',
        backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 50
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Shield size={24} color="var(--orange)" />
            <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>DigiWarden Vault</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <span style={{ fontSize: 14, color: 'var(--text2)' }}>{email}</span>
            <button 
              onClick={logout}
              style={{ background: 'none', border: 'none', fontSize: 14, color: 'var(--text2)', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = 'var(--text2)'}
            >
              Sign out
            </button>
            <button 
              onClick={() => navigate('landing')}
              style={{
                background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 8,
                padding: '8px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.target.style.background = 'var(--orange2)'; e.target.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.target.style.background = 'var(--orange)'; e.target.style.transform = 'none' }}
            >
              Register New Asset
            </button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, fontFamily: 'Syne, sans-serif' }}>Your Protected Assets</h1>
            <p style={{ color: 'var(--text2)', fontSize: 16 }}>Manage your intellectual property and track infringements.</p>
          </div>
          <button
            onClick={() => setShowDeleteAccount(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'none',
              border: '1px solid rgba(255,59,92,0.3)', borderRadius: 8, padding: '8px 14px',
              fontSize: 13, color: 'var(--red)', cursor: 'pointer', transition: 'all 0.2s',
              opacity: 0.7
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.borderColor = 'var(--red)' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.borderColor = 'rgba(255,59,92,0.3)' }}
          >
            <UserX size={14} /> Delete Account
          </button>
        </div>

        {error && (
          <div style={{
            background: 'var(--red-dim)', border: '1px solid rgba(255,59,92,0.2)',
            color: 'var(--red)', padding: 16, borderRadius: 12, marginBottom: 32
          }}>
            {error}
          </div>
        )}

        {vaultItems.length === 0 && !error ? (
          <div style={{
            textAlign: 'center', padding: '80px 20px', background: 'var(--surface)',
            borderRadius: 24, border: '1px dashed var(--border)',
          }}>
            <ImageIcon size={64} color="var(--text3)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Your vault is empty</h3>
            <p style={{ color: 'var(--text2)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
              Upload and register your first image to begin tracking and protecting your intellectual property across the web.
            </p>
            <button 
              onClick={() => navigate('landing')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--orange)',
                color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px',
                fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <Fingerprint size={20} /> Register an Asset
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24
          }}>
            {vaultItems.map((item) => (
              <div key={item.image_id} style={{
                background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16,
                overflow: 'hidden', transition: 'border-color 0.2s',
              }}>
                <div style={{ height: 180, background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
                  <img 
                    src={`http://localhost:8000${item.thumbnail_url}`}
                    alt={item.filename}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}></div>
                  <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>
                      {item.filename}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text2)', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: 4, backdropFilter: 'blur(4px)' }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {/* Delete button overlay */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.image_id, item.filename); }}
                    disabled={deletingId === item.image_id}
                    style={{
                      position: 'absolute', top: 10, right: 10,
                      width: 32, height: 32, borderRadius: 8,
                      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,59,92,0.3)', color: 'var(--red)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: deletingId === item.image_id ? 'wait' : 'pointer',
                      transition: 'all 0.2s', opacity: 0.7
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(255,59,92,0.2)' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.background = 'rgba(0,0,0,0.6)' }}
                    title="Delete this asset"
                  >
                    {deletingId === item.image_id 
                      ? <div style={{ width: 14, height: 14, border: '2px solid var(--red)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }}></div>
                      : <Trash2 size={14} />
                    }
                  </button>
                </div>
                
                <div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <div style={{ position: 'absolute', inset: 0, border: '2px solid var(--green-dim)', borderRadius: '50%', clipPath: `polygon(0 0, 100% 0, 100% ${item.integrity_score}%, 0 ${item.integrity_score}%)` }}></div>
                      <Shield size={20} color="var(--text3)" style={{ zIndex: 1 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text2)' }}>Integrity Score</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: 'var(--green)' }}>{item.integrity_score}%</div>
                    </div>
                  </div>
                  
                  {item.infringing_copies > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--red)', background: 'var(--red-dim)', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: '1px solid rgba(255,59,92,0.2)' }}>
                      <AlertTriangle size={14} />
                      {item.infringing_copies} Infringements
                    </div>
                  )}
                </div>
                
                <div style={{ padding: 16, background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                    {item.total_copies} total copies found
                  </div>
                  <button 
                    onClick={() => navigate('dashboard', { analysis: { image_id: item.image_id } })}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--orange)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    View Analysis <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Account Confirmation Modal */}
      {showDeleteAccount && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }} onClick={() => setShowDeleteAccount(false)}>
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 20,
            padding: 32, maxWidth: 420, width: '90%', textAlign: 'center'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: 'var(--red-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              border: '1px solid rgba(255,59,92,0.3)'
            }}>
              <UserX size={28} color="var(--red)" />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10, fontFamily: 'Syne, sans-serif' }}>Delete Account?</h3>
            <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
              This will permanently delete your account, all your registered assets, analysis history, and DMCA drafts. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowDeleteAccount(false)}
                style={{
                  flex: 1, padding: '12px 20px', borderRadius: 10, border: '1px solid var(--border)',
                  background: 'var(--surface)', color: 'var(--text)', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                style={{
                  flex: 1, padding: '12px 20px', borderRadius: 10, border: 'none',
                  background: 'var(--red)', color: '#fff', fontSize: 14, fontWeight: 600,
                  cursor: deletingAccount ? 'wait' : 'pointer', opacity: deletingAccount ? 0.6 : 1
                }}
              >
                {deletingAccount ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
