import {apiRequest} from '@/services/setup.ts';
import {PostObject, PresignedUrl, PresignedUrlResponse, UploadStatus} from '@/services/types.ts';
import {FileApiResponse, FileApiResponseItem} from "@/services/types.ts";
import {Item} from "@/components/types/types.ts"
import axios, {AxiosResponse} from 'axios';

/**
 * Function to request pre-signed URLs for a list of media items.
 * @param items - List of Items for which to request pre-signed URLs.
 * @returns List of Pre-signed URL responses from the API.
 */
export const getPreSignedUrls = async (items: Item[]): Promise<PresignedUrl[]> => {
    // Map the MediaItems to PostObjects using the title as the id
    const postObjects: PostObject[] = items.map(item => ({object_key: item.title, file_type: item.file_type}));

    // Send the request to the backend
    const response = await apiRequest<PresignedUrlResponse>('get-pre-signed-urls/', {
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
 * @returns Upload result containing list of upload statuses and indexes of successfully uploaded items.
 */
export const uploadItemsUsingPreSignedUrls = async (
    items: Item[],
    preSignedUrls: PresignedUrl[]
): Promise<{ uploadStatuses: UploadStatus[], uploadedItemIndexes: number[] }> => {
    const uploadStatuses: UploadStatus[] = [];
    const uploadedItemIndexes: number[] = [];

    const remainingPreSignedUrls = [...preSignedUrls]; // Create a copy to mutate

    for (const [index, item] of items.entries()) {
        // Find the first available pre-signed URL for the current item based on the original_object_key
        const urlIndex = remainingPreSignedUrls.findIndex(
            urlResp => urlResp.original_object_key === item.title
        );

        if (urlIndex === -1) {
            console.error(`Pre-signed URL for item with title ${item.title} not found.`);
            uploadStatuses.push({object_key: item.title, status: 'error', errorMessage: 'Pre-signed URL not found'});
            continue;
        }

        const urlResponse = remainingPreSignedUrls.splice(urlIndex, 1)[0]; // Fetch and remove the URL

        try {
            // Send a PUT request to the pre-signed URL using Axios
            const response = await axios.put(urlResponse.pre_signed_url, item.raw, {
                headers: {
                    'Content-Type': urlResponse.content_type // Explicitly specify the Content-Type header
                },
                timeout: 360000 // Add a timeout if necessary, unit ms
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
            // Keep track of uploaded item indexes
            uploadedItemIndexes.push(index);
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

    return {uploadStatuses, uploadedItemIndexes};
};

/**
 * Function to post successfully uploaded items to the backend.
 * @param uploadStatuses - List of upload statuses after uploading items.
 * @returns API response after posting items to the backend.
 */
export const postUploadedItems = async (uploadStatuses: UploadStatus[]): Promise<void> => {
    // Filter for successful uploads
    const successfullyUploadedItems = uploadStatuses.filter(status => status.status === 'success').map(status => status.uploaded_file);

    console.log('successfullyUploadedItems', successfullyUploadedItems);

    if (successfullyUploadedItems.length > 0) {
        const response: AxiosResponse<FileApiResponse> = await apiRequest('file/', {
            method: 'POST',
            data: successfullyUploadedItems
        });

        if (response.status != 201) {
            throw new Error("Failed to update item in database.");
        }

        console.log('Successfully posted items to the file table: ', response.data);
    }
};

/**
 * Function to fetch file items using GET method.
 * @returns Array of file items as a list of Item objects.
 */
export const fetchItems = async (): Promise<{ items: Item[], next: string | null }> => {
    try {
        // Make a GET request to the 'file/' endpoint
        const response = await apiRequest<FileApiResponse>('file/', {
            method: 'GET',
        });

        // Extract items from the results field
        const items: Item[] = response.data.results.map((item: FileApiResponseItem) => ({
            object_key: item.object_key,
            file_type: mapFileType(item.file_type),
            height: item.height,
            width: item.width,
            title: removeEndingSuffix(item.object_key), // Using object_key as title if it fits your design
            description: item.description,
            tags: item.tags,
            src: item.url, // Assign 'url' to 'src'
        }));

        return {items, next: response.data.next};
    } catch (error) {
        console.error('Error fetching media items:', error);
        throw error;
    }
};

export const fetchMoreItems = async (nextUrl: string | null): Promise<{ items: Item[], next: string | null }> => {
    console.log('nextUrl', nextUrl);
    if (!nextUrl) {
        console.log("All items have been loaded.");
        return {items: [], next: null};
    }

    try {
        const response = await apiRequest<FileApiResponse>(nextUrl, {
            method: 'GET',
        });

        const items: Item[] = response.data.results.map((item: FileApiResponseItem) => ({
            object_key: item.object_key,
            file_type: mapFileType(item.file_type),
            height: item.height,
            width: item.width,
            title: removeEndingSuffix(item.object_key),
            description: item.description,
            tags: item.tags,
            src: item.url,
        }));

        return {items, next: response.data.next};
    } catch (error) {
        console.error('Error fetching more items:', error);
        throw error;
    }
};

/**
 * Helper function to map numeric file_type to string representation.
 * @param fileType - Numeric file_type from the backend.
 * @returns Corresponding string representation.
 */
const mapFileType = (fileType: number): 'image' | 'video' | 'other' => {
    switch (fileType) {
        case 1:
            return 'image';
        case 2:
            return 'video';
        case 3:
            return 'other';
        default:
            return 'other';
    }
};


/**
 * Helper function to remove the ending timestamp or suffix from an object key.
 * @param objectKey - The original object key potentially with a timestamp or other suffix.
 * @returns The modified object key without the ending timestamp or suffix.
 */
const removeEndingSuffix = (objectKey: string): string => {
    // Match and remove any ending sequence starting with an underscore followed by a mix of numbers/letters before the extension
    return objectKey.replace(/(_[^_]+)(\.\w+)$/, '$2');
};