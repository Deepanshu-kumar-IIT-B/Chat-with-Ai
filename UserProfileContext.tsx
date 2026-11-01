import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from './types';
import { encryptForStorage, decryptFromStorage } from './clientCrypto';
import { apiClient } from './apiClient';

const STORAGE_KEY = 'aura_user_profile_sec';
const LEGACY_STORAGE_KEY = 'aura_user_profile';

interface UserProfileContextType {
  userProfile: UserProfile | null;
  hasProfile: boolean;
  isLoading: boolean;
  saveProfile: (profile: UserProfile) => void;
  updateProfile: (profile: UserProfile | Partial<UserProfile>) => void;
  deleteProfile: (clearChatHistory?: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initializeProfile() {
      let localProfile: UserProfile | null = null;
      try {
        // 1. Try modern encrypted client storage first
        const encrypted = localStorage.getItem(STORAGE_KEY);
        if (encrypted) {
          localProfile = await decryptFromStorage<UserProfile>(encrypted);
        } else {
          // Check and migrate any legacy plaintext profile
          const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
          if (legacy) {
            try {
              const parsed = JSON.parse(legacy);
              if (parsed && typeof parsed === 'object' && parsed.name) {
                localProfile = parsed;
                // Immediately encrypt in storage and remove plaintext key
                const enc = await encryptForStorage(parsed);
                localStorage.setItem(STORAGE_KEY, enc);
                localStorage.removeItem(LEGACY_STORAGE_KEY);
              }
            } catch (_) {}
          }
        }

        if (localProfile && isMounted) {
          setUserProfile(localProfile);
        }

        // 2. Establish authenticated session with server vault
        const sessionRes = await apiClient.initSession(localProfile || undefined);
        if (sessionRes && sessionRes.profile && isMounted) {
          setUserProfile(sessionRes.profile);
          const enc = await encryptForStorage(sessionRes.profile);
          localStorage.setItem(STORAGE_KEY, enc);
        }
      } catch (e) {
        // Fall back gracefully to local state without failing
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const saveProfile = async (profile: UserProfile) => {
    try {
      // 1. Update React state immediately
      setUserProfile(profile);

      // 2. Encrypt in client-side storage (zero plaintext)
      const encrypted = await encryptForStorage(profile);
      localStorage.setItem(STORAGE_KEY, encrypted);
      localStorage.removeItem(LEGACY_STORAGE_KEY);

      // 3. Persist to server encrypted vault
      await apiClient.saveProfile(profile);
    } catch (e) {
      // Silent catch to prevent UI break
    }
  };

  const updateProfile = (profile: UserProfile | Partial<UserProfile>) => {
    const merged: UserProfile = {
      name: profile.name ?? userProfile?.name ?? '',
      age: profile.age ?? userProfile?.age ?? 24,
      gender: profile.gender ?? userProfile?.gender ?? 'Other',
      nature: profile.nature ?? userProfile?.nature ?? 'Friendly',
      natureTags: profile.natureTags ?? userProfile?.natureTags ?? [],
      photoUrl: profile.photoUrl !== undefined ? profile.photoUrl : userProfile?.photoUrl
    };
    saveProfile(merged);
  };

  const deleteProfile = async (clearChatHistory: boolean = false) => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);

      if (clearChatHistory) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (key.startsWith('aura_chat_') || key.startsWith('aura_mood_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => sessionStorage.removeItem(k));
      }

      setUserProfile(null);
      setIsProfileModalOpen(false);

      // Delete on server encrypted vault
      await apiClient.deleteProfile(clearChatHistory);
    } catch (e) {
      // Silent catch
    }
  };

  return (
    <UserProfileContext.Provider
      value={{
        userProfile,
        hasProfile: !!userProfile?.name,
        isLoading,
        saveProfile,
        updateProfile,
        deleteProfile,
        isProfileModalOpen,
        setIsProfileModalOpen
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};
