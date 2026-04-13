import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
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

  if (isLoadingAuth || !isAuthenticated) return null;

  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  // Email change flow
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMessage, setEmailMessage] = useState(null); // { type: 'success' | 'error', text: string }
  
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

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return; // Prevent multiple clicks

    const val = formData.username.trim().toLowerCase();
    const regex = /^[a-z0-9_]{3,20}$/;
    
    if (!val || !regex.test(val)) {
      alert('Username must be 3-20 characters long, containing only letters, numbers, and underscores.');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...formData, username: val };
      await authService.updateProfile(user.id, payload);
      // Invalidate user cache to refresh Data
      queryClient.invalidateQueries(['user']);
      setFormData(prev => ({ ...prev, username: val })); // Sync lowercased
      alert('Profile updated successfully.');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeEmail = async () => {
    const trimmed = newEmail.trim();
    if (!trimmed || !/\S+@\S+\.\S+/.test(trimmed)) {
      setEmailMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    setEmailSaving(true);
    setEmailMessage(null);
    try {
      await authService.updateEmail(trimmed);
      setEmailMessage({ type: 'success', text: '' });
      setNewEmail('');
      setEditingEmail(false);
    } catch (err) {
      console.error('Email update error:', err);
      setEmailMessage({ type: 'error', text: err.message || 'Failed to update email.' });
    } finally {
      setEmailSaving(false);
    }
  };

  const handleCancelEmailEdit = () => {
    setEditingEmail(false);
    setNewEmail('');
    setEmailMessage(null);
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/');
  };

  const isCreator = user?.plan === 'CREATOR' || user?.plan === 'CREATOR_PLUS';

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
              
              {!editingEmail ? (
                <button
                  type="button"
                  onClick={() => { setEditingEmail(true); setEmailMessage(null); }}
                  className="mt-3 text-[10px] uppercase tracking-widest text-primary hover:text-foreground transition-colors"
                >
                  Change Email
                </button>
              ) : (
                <div className="mt-3 space-y-3">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="New email address"
                    className="w-full bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                    autoFocus
                  />
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={handleChangeEmail}
                      disabled={emailSaving}
                      className="text-[10px] uppercase tracking-widest text-primary hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      {emailSaving ? 'Sending...' : 'Save New Email'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEmailEdit}
                      className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mt-2">
                    Note: You must confirm from both emails for the change to complete.
                  </p>
                </div>
              )}

              {emailMessage && (
                emailMessage.type === 'error' ? (
                  <p className="mt-2 text-[10px] uppercase tracking-widest text-red-500">
                    {emailMessage.text}
                  </p>
                ) : (
                  <div className="mt-2">
                    <p className="text-[10px] uppercase tracking-widest text-green-600">
                      Email change requires confirmation from both your old and new email.
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-blue-500 font-medium mt-1">
                      Please check both inboxes.
                    </p>
                  </div>
                )
              )}
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
                <p className="text-sm font-bold uppercase tracking-widest">{user?.plan || 'FREE'}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Current Active Plan</p>
              </div>
              <button type="button" disabled className="px-4 py-2 border border-border text-xs uppercase tracking-widest text-muted-foreground opacity-50 cursor-not-allowed">
                Upgrade Options (Soon)
              </button>
            </div>
          </section>

          {/* CREATOR-ONLY SECTION */}
          {isCreator && (
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

          <div className="pt-8 flex items-center justify-between border-t border-border mt-12">
            <button 
              type="button" 
              onClick={handleLogout}
              className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Log Out
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 border border-border text-xs font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
            >
              {saving ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
