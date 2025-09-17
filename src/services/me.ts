export type MeInfo = { id: number; email: string; role?: string; roles?: string[] };

export async function getMe(): Promise<MeInfo> {
    // lấy từ localStorage trước
    const raw = localStorage.getItem("auth.user");
    if (raw) {
        try {
            return JSON.parse(raw) as MeInfo;
        } catch { /* empty */ }
    }


    return { id: 0, email: "", role: "" }; // default
}
