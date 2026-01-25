export interface Post {
    id: string;
    title: string;
    body: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ActionResult {
    success: boolean;
    message: string;
    errors?: Record<string, string[]>;
}
