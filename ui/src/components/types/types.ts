export interface FileInteraction {
    interaction_id: number; // Unique ID for the interaction
    interaction_type: 'like' | 'comment'; // Type of the interaction
    user_id: number; // ID of the user who performed the interaction
    username: string;
    created_datetime: string; // ISO string representation of when the interaction was created
}

export interface FileComment extends FileInteraction {
    comment?: string | null; // Holds the comment text if the interaction is a comment
}

export interface FileInteractionsSummary {
    total_likes: number; // Total number of likes
    likes: FileInteraction[];
    comments: FileComment[]; // Array of comment interactions
}

export interface Item {
    file_id?: number; // database auto generated id for PK
    object_key?: string | null; // Key or identifier for the file
    file_type: string; // Type of file ("image", "video", etc.)
    height?: number; // Height of the media (e.g., for images/videos)
    width?: number; // Width of the media (e.g., for images/videos)
    title: string; // Title of the file (optional)
    description: string; // Description of the file
    tags?: string[]; // Array of tags associated with the file
    raw?: object; // Holds the raw file object for handling uploads
    src?: string; // File source URL
    file_interactions?: FileInteractionsSummary; // Summary of file interactions, e.g., likes, dislikes, and comments
    status?: "idle" | "uploading" | "success" | "error"; // Add status property
    user_id?: number;
}

export interface MediaItem extends Item {
    file_type: 'image' | 'video';
}