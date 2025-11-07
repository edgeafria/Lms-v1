import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useAuth, axiosInstance } from '../contexts/AuthContext'; // Import axiosInstance from context
import { Link } from 'react-router-dom';
import axios from 'axios'; // Import axios for the avatar upload
import { Upload, User, Lock, Save, Camera, Linkedin, Twitter, Globe as GlobeIcon, Facebook } from 'lucide-react'; // Added icons

// Define state types
interface ProfileData {
  name: string;
  bio: string;
  skills: string; // Stored as comma-separated string in form
  location: string;
  website: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    linkedin: string;
    instagram: string;
  };
}
interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Helper: Get avatar URL safely
const getAvatarUrl = (avatar?: { url?: string } | string): string | undefined => {
   if (typeof avatar === 'string' && avatar && avatar !== 'no-photo.jpg') return avatar;
   if (typeof avatar === 'object' && avatar?.url && avatar.url !== 'no-photo.jpg') return avatar.url;
   return undefined;
};

const ProfileSettingsPage: React.FC = () => {
  const { user, loading, updateUserState } = useAuth(); // Get updateUserState

  // Form States
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '', bio: '', skills: '', location: '', website: '',
    socialLinks: { facebook: '', twitter: '', linkedin: '', instagram: '' }
  });
  const [passwordData, setPasswordData] = useState<PasswordData>({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // UI States
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [avatarMessage, setAvatarMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Populate form with user data on load
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        bio: user.bio || '',
        skills: user.skills?.join(', ') || '', // Convert array to comma-separated string
        location: user.location || '',
        website: user.website || '',
        socialLinks: {
            facebook: user.socialLinks?.facebook || '',
            twitter: user.socialLinks?.twitter || '',
            linkedin: user.socialLinks?.linkedin || '',
            instagram: user.socialLinks?.instagram || '',
        }
      });
      // Set initial avatar preview
      const avatarUrl = getAvatarUrl(user.avatar);
      if (avatarUrl) {
           setAvatarPreview(avatarUrl);
      } else {
           setAvatarPreview(`https://placehold.co/100x100/cccccc/000?text=${user.name.charAt(0)}`); // Placeholder
      }
    }
  }, [user]);

  // Handlers for form input changes
  const handleProfileChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };
   const handleSocialChange = (e: ChangeEvent<HTMLInputElement>) => {
    setProfileData({
      ...profileData,
      socialLinks: {
        ...profileData.socialLinks,
        [e.target.name]: e.target.value
      }
    });
  };
  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  // --- Avatar Upload Logic ---
  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      handleAvatarSubmit(file); // Auto-submit on selection
    }
  };

  const handleAvatarSubmit = async (file: File) => {
    setAvatarLoading(true); setAvatarMessage(null);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      // Use the exported axiosInstance from context (it has the token)
      const response = await axiosInstance.post('/users/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setAvatarMessage({ type: 'success', text: 'Avatar updated successfully!' });
        updateUserState(response.data.data); // Update context with full user data
        setAvatarFile(null);
      } else { throw new Error(response.data.message || 'Avatar upload failed'); }
    } catch (err) {
      let msg = 'Avatar upload failed.';
      if (axios.isAxiosError(err) && err.response?.data?.message) msg = err.response.data.message;
      else if (err instanceof Error) msg = err.message;
      setAvatarMessage({ type: 'error', text: msg });
    } finally { setAvatarLoading(false); }
  };

  // --- Profile Info Submit Logic ---
  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileLoading(true); setProfileMessage(null);

    // --- FIX: Flatten the body object ---
    const body = {
        name: profileData.name,
        bio: profileData.bio,
        website: profileData.website,
        location: profileData.location,
        skills: profileData.skills.split(',').map(s => s.trim()).filter(Boolean), // Convert string back to array
        socialLinks: profileData.socialLinks,
    };
    // ---------------------------------

    try {
      // Use axiosInstance (includes token)
      const response = await axiosInstance.put('/users/profile', body);
      if (response.data.success) {
        setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
        updateUserState(response.data.data); // Update context
      } else { throw new Error(response.data.message || 'Failed to update profile'); }
    } catch (err) {
      let msg = 'Profile update failed.';
      if (axios.isAxiosError(err) && err.response?.data?.message) msg = err.response.data.message;
      else if (err instanceof Error) msg = err.message;
      setProfileMessage({ type: 'error', text: msg });
    } finally { setProfileLoading(false); }
  };

  // --- Password Change Submit Logic ---
  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true); setPasswordMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      setPasswordLoading(false); return;
    }
     if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      setPasswordLoading(false); return;
    }

    try {
      const body = { currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword };
      // Use axiosInstance (includes token)
      const response = await axiosInstance.post('/users/change-password', body);
      if (response.data.success) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Clear fields
      } else { throw new Error(response.data.message || 'Failed to change password'); }
    } catch (err) {
      let msg = 'Password change failed.';
      if (axios.isAxiosError(err) && err.response?.data?.message) msg = err.response.data.message;
      else if (err instanceof Error) msg = err.message;
      setPasswordMessage({ type: 'error', text: msg });
    } finally { setPasswordLoading(false); }
  };


  // --- Render Logic ---
  if (loading) { // Auth loading
    return ( <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div></div> );
  }
  if (!user) { // Not logged in
    return ( <div className="min-h-screen flex items-center justify-center px-4"> {/* Access Denied Message */} </div> );
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-headline font-bold text-gray-900 mb-8">
                Account Settings
            </h1>
            
            {/* --- Avatar Upload Section --- */}
            <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8 mb-8">
                 <h2 className="text-xl font-headline font-semibold text-gray-800 mb-6"> Profile Picture </h2>
                {avatarMessage && (
                    <div className={`mb-4 p-3 border rounded-lg text-sm ${avatarMessage.type === 'success' ? 'bg-green-100 border-green-300 text-green-700' : 'bg-red-100 border-red-300 text-red-700'}`}>
                        {avatarMessage.text}
                    </div>
                )}
                <div className="flex items-center space-x-6">
                    <div className="relative">
                        <img src={avatarPreview || `https://placehold.co/100x100/cccccc/000?text=${user.name.charAt(0)}`} alt="Avatar preview" className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 shadow-sm" />
                        <label htmlFor="avatar-upload" className="absolute -bottom-2 -right-2 bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-full cursor-pointer shadow-md transition-transform transform hover:scale-110" title="Change profile picture">
                            <Camera className="w-4 h-4" />
                            <input type="file" id="avatar-upload" name="avatar" accept="image/png, image/jpeg, image/gif" onChange={handleAvatarChange} className="sr-only" />
                        </label>
                    </div>
                     <div className="flex-1">
                        <p className="text-gray-600 font-body text-sm max-w-md"> {avatarLoading ? "Uploading..." : "Click the camera icon to upload a new photo (max 5MB)."} </p>
                        {avatarLoading && <div className="w-full bg-gray-200 rounded-full h-1 mt-2"><div className="bg-primary-500 h-1 rounded-full animate-pulse"></div></div>}
                    </div>
                </div>
            </div>

            {/* --- Profile Info Form --- */}
            <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8 mb-8">
                <h2 className="text-xl font-headline font-semibold text-gray-800 mb-6"> Public Profile </h2>
                {profileMessage && (
                    <div className={`mb-6 p-3 border rounded-lg text-sm ${profileMessage.type === 'success' ? 'bg-green-100 border-green-300 text-green-700' : 'bg-red-100 border-red-300 text-red-700'}`}>
                        {profileMessage.text}
                    </div>
                )}
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                    {/* Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-body font-medium text-gray-700 mb-2"> Full Name </label>
                            <input id="name" name="name" type="text" value={profileData.name} onChange={handleProfileChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-body font-medium text-gray-700 mb-2"> Email Address </label>
                            <input id="email" name="email" type="email" value={user.email} disabled className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed" />
                        </div>
                    </div>
                    {/* Bio */}
                     <div>
                        <label htmlFor="bio" className="block text-sm font-body font-medium text-gray-700 mb-2"> Your Bio </label>
                        <textarea id="bio" name="bio" rows={4} value={profileData.bio} onChange={handleProfileChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Tell us a little about yourself..." />
                    </div>
                    {/* Skills */}
                     <div>
                        <label htmlFor="skills" className="block text-sm font-body font-medium text-gray-700 mb-2"> Your Skills </label>
                        <input id="skills" name="skills" type="text" value={profileData.skills} onChange={handleProfileChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g., React, Node.js, UI/UX Design" />
                        <p className="text-xs text-gray-500 mt-1">Separate skills with a comma.</p>
                    </div>
                    {/* Location & Website */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="location" className="block text-sm font-body font-medium text-gray-700 mb-2"> Location </label>
                            <input id="location" name="location" type="text" value={profileData.location} onChange={handleProfileChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g., Lagos, Nigeria" />
                        </div>
                         <div>
                            <label htmlFor="website" className="block text-sm font-body font-medium text-gray-700 mb-2"> Website / Portfolio </label>
                            <input id="website" name="website" type="url" value={profileData.website} onChange={handleProfileChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="https://" />
                        </div>
                    </div>
                    {/* Social Links */}
                    <div>
                         <label className="block text-sm font-body font-medium text-gray-700 mb-3"> Social Links </label>
                         <div className="space-y-4">
                             <div className="flex items-center space-x-3">
                                <label htmlFor="linkedin" className="w-10 flex-shrink-0 text-gray-500"><Linkedin className="w-5 h-5"/></label>
                                <input id="linkedin" name="linkedin" type="url" value={profileData.socialLinks.linkedin} onChange={handleSocialChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="LinkedIn URL" />
                             </div>
                             <div className="flex items-center space-x-3">
                                <label htmlFor="twitter" className="w-10 flex-shrink-0 text-gray-500"><Twitter className="w-5 h-5"/></label>
                                <input id="twitter" name="twitter" type="url" value={profileData.socialLinks.twitter} onChange={handleSocialChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="Twitter URL" />
                             </div>
                             {/* Add Facebook/Instagram if needed */}
                         </div>
                    </div>
                    {/* Save Profile Button */}
                    <div className="pt-4">
                         <button type="submit" disabled={profileLoading} className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-body font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center space-x-2">
                           <Save className="w-4 h-4" />
                           <span>{profileLoading ? 'Saving...' : 'Save Profile Changes'}</span>
                         </button>
                    </div>
                </form>
            </div>

            {/* --- Change Password Form --- */}
             <div className="bg-white rounded-xl shadow-sm border p-6 md:p-8">
                <h2 className="text-xl font-headline font-semibold text-gray-800 mb-6"> Change Password </h2>
                 {passwordMessage && (
                    <div className={`mb-6 p-3 border rounded-lg text-sm ${passwordMessage.type === 'success' ? 'bg-green-100 border-green-300 text-green-700' : 'bg-red-100 border-red-300 text-red-700'}`}>
                        {passwordMessage.text}
                    </div>
                )}
                <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
                    <div>
                        <label htmlFor="currentPassword" className="block text-sm font-body font-medium text-gray-700 mb-2"> Current Password </label>
                        <input id="currentPassword" name="currentPassword" type="password" value={passwordData.currentPassword} onChange={handlePasswordChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                     <div>
                        <label htmlFor="newPassword" className="block text-sm font-body font-medium text-gray-700 mb-2"> New Password </label>
                        <input id="newPassword" name="newPassword" type="password" value={passwordData.newPassword} onChange={handlePasswordChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                     <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-body font-medium text-gray-700 mb-2"> Confirm New Password </label>
                        <input id="confirmPassword" name="confirmPassword" type="password" value={passwordData.confirmPassword} onChange={handlePasswordChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div className="pt-4">
                         <button type="submit" disabled={passwordLoading} className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-body font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center space-x-2">
                           <Lock className="w-4 h-4" />
                           <span>{passwordLoading ? 'Updating...' : 'Update Password'}</span>
                         </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
  );
};

export default ProfileSettingsPage;