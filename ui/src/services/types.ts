// Interface for the POST object with an ID
import {Item} from "@/components/types/types.ts";

export interface PostObject {
    object_key: string; // Object ID that will be sent to the backend
}

// General API response interface
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T; // The actual data being returned in the response
}

/**
 * Interface representing the full response structure.
 */
export interface FullApiResponse<T> {
    data: ApiResponse<T>;
    status: number;
    statusText: string;
    headers: unknown;
}

// Interface for the pre-signed URL response
export interface PresignedUrlResponse {
    original_object_key: string;
    unique_object_key: string;
    pre_signed_url: string;
    content_type: string;
}

export interface UploadStatus {
    object_key: string;
    status: 'success' | 'error';
    uploaded_file?: Item  // Optional list of items, for successful upload, will be used to update file table
    httpStatusCode?: number;  // Optional HTTP status code
    responseMessage?: string;  // Optional response message
    errorMessage?: string;  // Optional for errors
    errorCode?: string; // Optional error code
}