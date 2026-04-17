import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { usePlan } from '@/hooks/usePlan';
import { authService } from '@/services/authService';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import CornerNav from '@/components/CornerNav';
import { useQueryClient } from '@tanstack/react-query';
import { User } from 'lucide-react';

export default function Profile() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      navigate('/auth', { replace: true });
    }
  }, [isLoadingAuth, isAuthenticated, navigate]);

  if (isLoadingAuth) {
    return <div className="min-h-screen bg-background" />;
  }

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null); // { type: 'success' | 'error', text: string }
  const fileInputRef = useRef(null);

  // Username validation
  const [usernameStatus, setUsernameStatus] = useState('idle'); // idle | checking | available | taken | invalid
  const [usernameMessage, setUsernameMessage] = useState('');
  const debounceRef = useRef(null);

  
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    avatar_url: '',
    instagram: '',
    twitter: '',
    youtube: '',
    website: '',
    is_public_profile: false
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        username: user.username || '',
        avatar_url: user.avatar_url || '',
        instagram: user.instagram || '',
        twitter: user.twitter || '',
        youtube: user.youtube || '',
        website: user.website || '',
        is_public_profile: user.is_public_profile || false
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (name === 'username') {
      setSaveMessage(null);
      const val = value.trim().toLowerCase();
      const regex = /^[a-z0-9_]{3,20}$/;
      if (!val) {
        setUsernameStatus('idle');
        setUsernameMessage('');
        return;
      }
      if (!regex.test(val)) {
        setUsernameStatus('invalid');
        setUsernameMessage('3–20 chars, lowercase letters, numbers, underscores only');
        return;
      }
      // Same as current username — no need to check
      if (val === user?.username) {
        setUsernameStatus('idle');
        setUsernameMessage('');
        return;
      }
      setUsernameStatus('checking');
      setUsernameMessage('Checking...');
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', val)
            .neq('id', user.id)
            .maybeSingle();
          if (existing) {
            setUsernameStatus('taken');
            setUsernameMessage('Username already taken');
          } else {
            setUsernameStatus('available');
            setUsernameMessage('Username available');
          }
        } catch {
          setUsernameStatus('idle');
          setUsernameMessage('');
        }
      }, 500);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user?.id) return; // Block upload if not authenticated
    
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    setUploadingAvatar(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(async (blob) => {
          if (!blob) {
            setUploadingAvatar(false);
            alert('Image conversion failed.');
            return;
          }
          
          try {
             const filePath = `${user.id}.webp`;
             
             const { error: uploadError } = await supabase.storage
               .from('avatars')
               .upload(filePath, blob, {
                 upsert: true,
                 contentType: 'image/webp'
               });
               
             if (uploadError) throw uploadError;
             
             const { data: { publicUrl } } = supabase.storage
               .from('avatars')
               .getPublicUrl(filePath);
               
             // Update local state for instant preview
             setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
             
             // Save directly to profiles table as instructed
             await authService.updateProfile(user.id, { avatar_url: publicUrl });
             queryClient.invalidateQueries(['user']);
          } catch (err) {
             console.error(err);
             alert('Failed to upload avatar.');
          } finally {
             setUploadingAvatar(false);
             if (fileInputRef.current) fileInputRef.current.value = '';
          }
        }, 'image/webp', 0.8);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const isUsernameSaveBlocked = usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'checking';

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving || isUsernameSaveBlocked) return;

    const val = formData.username.trim().toLowerCase();
    const regex = /^[a-z0-9_]{3,20}$/;
    
    if (!val || !regex.test(val)) {
      setUsernameStatus('invalid');
      setUsernameMessage('3–20 chars, lowercase letters, numbers, underscores only');
      return;
    }

    setSaving(true);
    setSaveMessage(null);
    try {
      const payload = { ...formData, username: val };
      await authService.updateProfile(user.id, payload);
      queryClient.invalidateQueries(['user']);
      setFormData(prev => ({ ...prev, username: val }));
      setUsernameStatus('idle');
      setUsernameMessage('');
      setSaveMessage({ type: 'success', text: 'Profile updated successfully.' });
    } catch (err) {
      console.error(err);
      setSaveMessage({ type: 'error', text: err.message || 'Error updating profile.' });
    } finally {
      setSaving(false);
    }
  };


  const handleLogout = async () => {
    await authService.logout();
    navigate('/');
  };

  const { canUseSocialLinks, canUsePublicProfile, planInfo } = usePlan();

  return (
    <div className="min-h-screen bg-background text-foreground font-mono selection:bg-primary selection:text-primary-foreground flex flex-col">
      <CornerNav to="/admin" label="Back to Admin" />

      <main className="flex-grow w-full max-w-3xl mx-auto px-6 md:px-12 py-24">
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tighter uppercase mb-2">Profile Settings</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Manage your identity and plan settings</p>
        </div>

        <form onSubmit={handleSave} className="space-y-12">
          {/* A. BASIC INFO */}
          <section className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4">Basic Info</h2>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-foreground transition-colors mb-6"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                placeholder="Choose a global identifier"
                required
              />
              {usernameMessage && (
                <p className={`mt-1 text-[10px] uppercase tracking-widest ${
                  usernameStatus === 'available' ? 'text-green-500' :
                  usernameStatus === 'checking' ? 'text-muted-foreground' :
                  'text-red-500'
                }`}>
                  {usernameMessage}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="mt-6">
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-transparent border-b border-border py-2 text-sm text-muted-foreground cursor-not-allowed"
              />
            </div>
          </section>

          {/* B. PROFILE PICTURE */}
          <section className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest border-b border-border pb-2">Profile Picture</h2>
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Avatar Preview" className="w-16 h-16 rounded-full border border-border object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full border border-border flex items-center justify-center bg-secondary">
                    <User className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              <div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="px-6 py-2 border border-border text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
                >
                  {uploadingAvatar ? 'UPLOADING...' : 'UPLOAD IMAGE'}
                </button>
              </div>
            </div>
          </section>

          {/* C. PLAN SECTION (DUMMY) */}
          <section className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest border-b border-border pb-2">Subscription Plan</h2>
            <div className="bg-secondary/20 p-6 border border-border flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest">{planInfo.label}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Current Active Plan</p>
              </div>
              <button type="button" disabled className="px-4 py-2 border border-border text-xs uppercase tracking-widest text-muted-foreground opacity-50 cursor-not-allowed">
                Upgrade Options (Soon)
              </button>
            </div>
          </section>

          {/* CREATOR-ONLY SECTION */}
          {canUseSocialLinks && (
            <section className="space-y-6 pt-6">
              <h2 className="text-sm font-bold uppercase tracking-widest border-b border-border pb-2 text-primary">Creator Profile</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Instagram Username</label>
                  <input
                    type="text"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleChange}
                    className="w-full bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Twitter / X Username</label>
                  <input
                    type="text"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleChange}
                    className="w-full bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                    placeholder="@username"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">YouTube Channel URL</label>
                  <input
                    type="text"
                    name="youtube"
                    value={formData.youtube}
                    onChange={handleChange}
                    className="w-full bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                    placeholder="https://youtube.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Personal Website</label>
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <input
                  type="checkbox"
                  id="is_public_profile"
                  name="is_public_profile"
                  checked={formData.is_public_profile}
                  onChange={handleChange}
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor="is_public_profile" className="text-sm uppercase tracking-widest cursor-pointer select-none">
                  Enable Public Profile & Vault
                </label>
              </div>
            </section>
          )}

          <div className="pt-8 flex flex-col gap-4 border-t border-border mt-12">
            <div className="flex items-center justify-between">
              <button 
                type="button" 
                onClick={handleLogout}
                className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                Log Out
              </button>
              <button
                type="submit"
                disabled={saving || isUsernameSaveBlocked}
                className="px-8 py-3 border border-border text-xs font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
              >
                {saving ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
            </div>
            {saveMessage && (
              <p className={`text-[10px] uppercase tracking-widest ${
                saveMessage.type === 'success' ? 'text-green-500' : 'text-red-500'
              }`}>
                {saveMessage.text}
              </p>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
