// Interface for the POST object with an ID
export interface PostObject {
    object_key: string; // Object ID that will be sent to the backend
}

// General API response interface
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T; // The actual data being returned in the response
}

// Interface for the pre-signed URL response
export interface PresignedUrlResponse {
    original_object_key: string;
    unique_object_key: string;
    url: string;
}

export interface UploadStatus {
    object_key: string;
    status: 'success' | 'error';
    httpStatusCode?: number;  // Optional HTTP status code
    responseMessage?: string;  // Optional response message
    errorMessage?: string;  // Optional for errors
    errorCode?: string; // Optional error code
}