export type ApiEnvelope<T> = {
    statusCode: number;
    error: string | null;
    message: string;
    data: T;
};

export type ApiErrorBody = { message?: string };
