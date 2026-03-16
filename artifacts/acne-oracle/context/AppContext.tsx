import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type AcneType =
  | "comedonal"
  | "inflammatory"
  | "cystic"
  | "hormonal"
  | "mixed"
  | "unknown";

export type SeverityLevel = 1 | 2 | 3 | 4 | 5;

export interface AnalysisResult {
  id: string;
  date: string;
  imageUri: string;
  acneType: AcneType;
  severity: SeverityLevel;
  description: string;
  recommendations: string[];
  triggerProducts: string[];
  alternativeProducts: string[];
  routine: string[];
}

export interface SkincareProduct {
  id: string;
  name: string;
  brand: string;
  cost: number;
  category: string;
  addedDate: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface AppState {
  analyses: AnalysisResult[];
  products: SkincareProduct[];
  chatHistory: ChatMessage[];
  streak: number;
  lastAnalysisDate: string | null;
  isPremium: boolean;
}

interface AppContextValue extends AppState {
  addAnalysis: (analysis: AnalysisResult) => Promise<void>;
  addProduct: (product: Omit<SkincareProduct, "id" | "addedDate">) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  addChatMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => Promise<void>;
  clearChat: () => Promise<void>;
  setIsPremium: (val: boolean) => void;
  monthlySpend: number;
  latestAnalysis: AnalysisResult | null;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = "acneoracle_data_v1";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    analyses: [],
    products: [],
    chatHistory: [],
    streak: 0,
    lastAnalysisDate: null,
    isPremium: false,
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as AppState;
          setState(parsed);
        } catch {}
      }
    });
  }, []);

  const persist = useCallback(async (next: AppState) => {
    setState(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addAnalysis = useCallback(
    async (analysis: AnalysisResult) => {
      const today = new Date().toDateString();
      const newStreak =
        state.lastAnalysisDate === today
          ? state.streak
          : state.lastAnalysisDate ===
              new Date(Date.now() - 86400000).toDateString()
            ? state.streak + 1
            : 1;

      await persist({
        ...state,
        analyses: [analysis, ...state.analyses].slice(0, 60),
        streak: newStreak,
        lastAnalysisDate: today,
      });
    },
    [state, persist],
  );

  const addProduct = useCallback(
    async (product: Omit<SkincareProduct, "id" | "addedDate">) => {
      const newProduct: SkincareProduct = {
        ...product,
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        addedDate: new Date().toISOString(),
      };
      await persist({ ...state, products: [...state.products, newProduct] });
    },
    [state, persist],
  );

  const removeProduct = useCallback(
    async (id: string) => {
      await persist({
        ...state,
        products: state.products.filter((p) => p.id !== id),
      });
    },
    [state, persist],
  );

  const addChatMessage = useCallback(
    async (msg: Omit<ChatMessage, "id" | "timestamp">) => {
      const newMsg: ChatMessage = {
        ...msg,
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        timestamp: new Date().toISOString(),
      };
      await persist({
        ...state,
        chatHistory: [...state.chatHistory, newMsg].slice(-100),
      });
    },
    [state, persist],
  );

  const clearChat = useCallback(async () => {
    await persist({ ...state, chatHistory: [] });
  }, [state, persist]);

  const setIsPremium = useCallback(
    (val: boolean) => {
      setState((s) => ({ ...s, isPremium: val }));
    },
    [],
  );

  const monthlySpend = state.products.reduce((sum, p) => sum + p.cost, 0);
  const latestAnalysis = state.analyses[0] ?? null;

  return (
    <AppContext.Provider
      value={{
        ...state,
        addAnalysis,
        addProduct,
        removeProduct,
        addChatMessage,
        clearChat,
        setIsPremium,
        monthlySpend,
        latestAnalysis,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}
