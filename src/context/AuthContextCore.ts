import { createContext } from "react";
import type { AuthContextType } from "./AuthContext"; // nếu sợ vòng lặp, bạn có thể chép lại type ở đây

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
