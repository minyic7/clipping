// Interface for the POST object with an ID
import {Item} from "@/components/types/types.ts";
import {AxiosResponse} from "axios";

export interface PostObject {
    object_key: string; // Object ID that will be sent to the backend
}

/**
 * Interface representing the full response structure.
 */
export interface FullApiResponse<T> extends AxiosResponse{
    data: T;
    success?: boolean;
    message?: string;
}


// // General API response interface
// export interface ApiResponse<T> {
//     data: T; // The actual data being returned in the response
// }

// Updated definition of ApiResponseItem
export interface FileApiResponseItem {
    file_id: number;
    bucket_name: string;
    object_key: string;
    file_type: number;
    width: number;
    height: number;
    tags: string[];
    created_datetime: string;
    last_updated_datetime: string;
    description: string;
    user_id: number;
    url: string;
}

// Define the structure of the API response
export interface FileApiResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: FileApiResponseItem[];
}


export interface PresignedUrl {
    original_object_key: string;
    unique_object_key: string;
    pre_signed_url: string;
    content_type: string;
}

// Interface for the pre-signed URL response
export interface PresignedUrlResponse {
    data: PresignedUrl[];
    success: boolean;
    message: string;
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