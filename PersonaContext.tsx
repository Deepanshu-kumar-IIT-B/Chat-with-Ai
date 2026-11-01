import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Persona } from './types';
import { apiClient } from './apiClient';
import { encryptForStorage, decryptFromStorage } from './clientCrypto';

interface PersonaContextType {
  personas: Persona[];
  addPersona: (persona: Omit<Persona, 'id'>) => void;
  updatePersona: (id: string, updated: Partial<Persona>) => void;
  deletePersona: (id: string) => void;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

const PERSONAS_STORAGE_KEY = 'aura_personas_sec';

const initialPersonas: Persona[] = [];

export const PersonaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [personas, setPersonas] = useState<Persona[]>([]);

  // Initialize and load encrypted personas
  useEffect(() => {
    let isMounted = true;

    async function loadPersonas() {
      try {
        // 1. Check client-side encrypted cache
        const cachedEncrypted = localStorage.getItem(PERSONAS_STORAGE_KEY);
        if (cachedEncrypted) {
          const decrypted = await decryptFromStorage<Persona[]>(cachedEncrypted);
          if (decrypted && Array.isArray(decrypted) && isMounted) {
            // Clean up any legacy pre-created default personas ('1', '2', '3')
            const userCustom = decrypted.filter(p => !['1', '2', '3'].includes(p.id));
            setPersonas(userCustom);
            if (userCustom.length !== decrypted.length) {
              const enc = await encryptForStorage(userCustom);
              localStorage.setItem(PERSONAS_STORAGE_KEY, enc);
            }
          }
        }

        // 2. Fetch authenticated and decrypted from server vault
        const remote = await apiClient.getPersonas();
        if (remote && Array.isArray(remote) && isMounted) {
          // Clean up any legacy pre-created default personas
          const userPersonas = remote.filter(p => !['1', '2', '3'].includes(p.id));
          setPersonas(userPersonas);
          const enc = await encryptForStorage(userPersonas);
          localStorage.setItem(PERSONAS_STORAGE_KEY, enc);
        }
      } catch (_) {
        // Safe default: 0 personas
      }
    }

    loadPersonas();

    return () => {
      isMounted = false;
    };
  }, []);

  const addPersona = async (persona: Omit<Persona, 'id'>) => {
    const newPersona: Persona = { ...persona, id: `per_${Date.now()}` };
    const updated = [...personas, newPersona];
    setPersonas(updated);

    try {
      const enc = await encryptForStorage(updated);
      localStorage.setItem(PERSONAS_STORAGE_KEY, enc);
      await apiClient.savePersona(newPersona);
    } catch (_) {}
  };

  const updatePersona = async (id: string, updatedFields: Partial<Persona>) => {
    const updated = personas.map((p) => (p.id === id ? { ...p, ...updatedFields } : p));
    setPersonas(updated);

    try {
      const enc = await encryptForStorage(updated);
      localStorage.setItem(PERSONAS_STORAGE_KEY, enc);
      const target = updated.find((p) => p.id === id);
      if (target) {
        await apiClient.savePersona(target);
      }
    } catch (_) {}
  };

  const deletePersona = async (id: string) => {
    const updated = personas.filter((p) => p.id !== id);
    setPersonas(updated);

    try {
      const enc = await encryptForStorage(updated);
      localStorage.setItem(PERSONAS_STORAGE_KEY, enc);
      await apiClient.deletePersona(id);
    } catch (_) {}
  };

  return (
    <PersonaContext.Provider value={{ personas, addPersona, updatePersona, deletePersona }}>
      {children}
    </PersonaContext.Provider>
  );
};

export const usePersonas = () => {
  const context = useContext(PersonaContext);
  if (context === undefined) {
    throw new Error('usePersonas must be used within a PersonaProvider');
  }
  return context;
};
