import { create } from 'zustand';
import { User } from 'firebase/auth';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface UserData {
    nickname: string;
    email: string;
    licenseKey?: string;
    isBanned?: boolean;
    createdAt: any;
}

interface AuthState {
    user: User | null;
    userData: UserData | null;
    loading: boolean;
    setUser: (user: User | null) => void;
    fetchUserData: (uid: string) => Promise<void>;
    setLoading: (loading: boolean) => void;
}



export const useAuthStore = create<AuthState>((set: any) => ({ // Fixed Vercel TS Errors
    user: null,
    userData: null,
    loading: true,
    setUser: (user: User | null) => set({ user }),
    fetchUserData: async (uid: string) => {
        try {
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                set({ userData: docSnap.data() as UserData });
            } else {
                set({ userData: null });
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            set({ userData: null });
        }
    },
    setLoading: (loading: boolean) => set({ loading }),
}));
