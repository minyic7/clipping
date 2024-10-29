// src/services/services.ts
import { apiRequest } from '@/services/setup.ts';
import {PostObject, PresignedUrlResponse, UploadStatus} from '@/services/types.ts';
import { Item } from "@/components/types/types.ts";
import axios from 'axios';
// import {sleep} from "@/services/utils.ts";


/**
 * Function to request pre-signed URLs for a list of media items.
 * @param items - List of Items for which to request pre-signed URLs.
 * @returns List of Pre-signed URL responses from the API.
 */
export const getPreSignedUrls = async (items: Item[]): Promise<PresignedUrlResponse[]> => {
    // Map the MediaItems to PostObjects using the title as the id
    const postObjects: PostObject[] = items.map(item => ({ object_key: item.title }));

    // Send the request to the backend
    const response = await apiRequest<PresignedUrlResponse[]>('/clipping/get_pre_signed_urls', {
        method: 'POST',
        data: postObjects
    });

    if (!response.success) {
        throw new Error(response.message);
    }

    return response.data;
};

/**
 * Function to upload items to their respective pre-signed URLs with detailed status tracking.
 * @param items - List of Items to be uploaded.
 * @param preSignedUrls - List of pre-signed URL responses.
 * @returns List of upload statuses.
 */
export const uploadItemsUsingPreSignedUrls = async (
    items: Item[],
    preSignedUrls: PresignedUrlResponse[]
): Promise<UploadStatus[]> => {

    // Sleep for 1 second before proceeding
    // await sleep(1000);

    const uploadStatuses: UploadStatus[] = [];

    const remainingPreSignedUrls = [...preSignedUrls]; // Create a copy to mutate

    for (const item of items) {
        // Find the first available pre-signed URL for the current item based on the original_object_key
        const urlIndex = remainingPreSignedUrls.findIndex(
            urlResp => urlResp.original_object_key === item.title
        );

        if (urlIndex === -1) {
            console.error(`Pre-signed URL for item with title ${item.title} not found.`);
            uploadStatuses.push({ object_key: item.title, status: 'error', errorMessage: 'Pre-signed URL not found' });
            continue;
        }

        const urlResponse = remainingPreSignedUrls.splice(urlIndex, 1)[0]; // Fetch and remove the URL

        try {
            // Send a PUT request to the pre-signed URL using Axios
            const response = await axios.put(urlResponse.url, item);

            // Mark the status as success and store the HTTP status code and response message
            uploadStatuses.push({
                object_key: urlResponse.unique_object_key,
                status: 'success',
                httpStatusCode: response.status,
                responseMessage: response.statusText
            });
        } catch (error: unknown) {
            // Narrow down the error type
            if (axios.isAxiosError(error)) {
                console.log('Axios error', error);
                // Extract error details from AxiosError
                const httpStatusCode = error.response?.status;
                const responseMessage = error.response?.statusText;
                const errorCode = error.code;
                const errorMessage = error.message;

                console.error(`Axios Error uploading item with key ${urlResponse.unique_object_key}:`, error);

                // Mark the status as error and store the error details
                uploadStatuses.push({
                    object_key: urlResponse.unique_object_key,
                    status: 'error',
                    httpStatusCode,
                    responseMessage,
                    errorCode,
                    errorMessage
                });
            } else {
                // Handle non-Axios errors
                console.error(`Unknown error uploading item with key ${urlResponse.unique_object_key}:`, error);

                uploadStatuses.push({
                    object_key: urlResponse.unique_object_key,
                    status: 'error',
                    errorMessage: 'Unknown error occurred'
                });
            }
        }
    }

    return uploadStatuses;
};