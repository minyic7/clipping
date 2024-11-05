import { apiRequest } from '@/services/setup.ts';
import {FullApiResponse, PostObject, PresignedUrlResponse, UploadStatus} from '@/services/types.ts';
import { Item } from "@/components/types/types.ts";
import axios from 'axios';

/**
 * Function to request pre-signed URLs for a list of media items.
 * @param items - List of Items for which to request pre-signed URLs.
 * @returns List of Pre-signed URL responses from the API.
 */
export const getPreSignedUrls = async (items: Item[]): Promise<PresignedUrlResponse[]> => {
    // Map the MediaItems to PostObjects using the title as the id
    const postObjects: PostObject[] = items.map(item => ({ object_key: item.title, file_type: item.type }));

    // Send the request to the backend
    const response: FullApiResponse<PresignedUrlResponse[]> = await apiRequest<PresignedUrlResponse[]>('get-pre-signed-urls/', {
        method: 'POST',
        data: postObjects
    });

    if (!response.data.success) {
        throw new Error(response.data.message);
    }

    return response.data.data;
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
            console.log('item raw', item)
            const response = await axios.put(urlResponse.pre_signed_url, item.raw, {
                headers: {
                    'Content-Type': urlResponse.content_type // Explicitly specify the Content-Type header
                },
                timeout: 5000 // Add a timeout if necessary
            });

            // Update the item's object_key with the unique_object_key from the response
            item.object_key = urlResponse.unique_object_key;

            // Mark the status as success and store the HTTP status code, response message, and item
            uploadStatuses.push({
                object_key: urlResponse.unique_object_key,
                status: 'success',
                uploaded_file: item,
                httpStatusCode: response.status,
                responseMessage: response.statusText
            });
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                console.log('Axios error', error);
                const httpStatusCode = error.response?.status;
                const responseMessage = error.response?.statusText;
                const errorCode = error.code;
                const errorMessage = error.message;

                console.error(`Axios Error uploading item with key ${urlResponse.unique_object_key}:`, error);

                uploadStatuses.push({
                    object_key: urlResponse.unique_object_key,
                    status: 'error',
                    httpStatusCode,
                    responseMessage,
                    errorCode,
                    errorMessage
                });
            } else {
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

/**
 * Function to post successfully uploaded items to the backend.
 * @param uploadStatuses - List of upload statuses after uploading items.
 * @returns API response after posting items to the backend.
 */
export const postUploadedItems = async (uploadStatuses: UploadStatus[]): Promise<void> => {
    // Filter for successful uploads
    const successfullyUploadedItems = uploadStatuses.filter(status => status.status === 'success').map(status => status.uploaded_file);

    if (successfullyUploadedItems.length > 0) {
        const response: FullApiResponse<unknown> = await apiRequest('file/', {
            method: 'POST',
            data: successfullyUploadedItems
        });

        console.log('response', response);

        if (response.status != 201) {
            throw new Error(response.data.message);
        }

        console.log('Successfully posted items to the file table:');
    }
};