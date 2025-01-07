import {apiRequest} from '@/services/setup.ts';
import {
    FileApiResponse,
    FileApiResponseItem,
    PostObject,
    PresignedUrl,
    PresignedUrlResponse,
    UploadStatus
} from '@/services/types.ts';
import {FileInteraction, FileInteractionsSummary, Item} from "@/components/types/types.ts"
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
            file_id: item.file_id,
            object_key: item.object_key,
            file_type: mapFileType(item.file_type),
            height: item.height,
            width: item.width,
            title: removeEndingSuffix(item.object_key), // Using object_key as title if it fits your design
            description: item.description,
            tags: item.tags,
            src: item.url, // Assign 'url' to 'src'
            user_id: item.user_id,
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
            file_id: item.file_id,
            object_key: item.object_key,
            file_type: mapFileType(item.file_type),
            height: item.height,
            width: item.width,
            title: removeEndingSuffix(item.object_key),
            description: item.description,
            tags: item.tags,
            src: item.url,
            user_id: item.user_id,
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


/**
 * Function to fetch interactions (likes, dislikes, and comments) for a specific file.
 * @param fileId - The ID of the file for which to fetch interactions. Must be a valid number.
 * @returns A summary of file interactions including total likes/dislikes and an array of comments.
 */
export const fetchInteractions = async (
    fileId: number | undefined
): Promise<FileInteractionsSummary> => {
    try {
        // Check if the fileId is undefined and promptly remind the user
        if (fileId === undefined) {
            console.error("File ID is undefined. Please provide a valid file ID.");
        }

        // Make a GET request to the endpoint for fetching interactions for the given file
        const response = await apiRequest<FileInteraction[]>(`file/${fileId}/interactions/`, {
            method: "GET",
        });

        // Extract data
        const fileInteractions: FileInteraction[] = response.data;

        // Summarize interactions into likes, dislikes, and comments
        const total_likes = fileInteractions.filter(
            (interaction) => interaction.interaction_type === "like"
        ).length;
        const likes = fileInteractions.filter(
            (interaction) => interaction.interaction_type === "like"
        );
        const comments = fileInteractions.filter(
            (interaction) => interaction.interaction_type === "comment"
        );

        // Construct the summary using the FileInteractionsSummary interface
        return {
            total_likes: total_likes,
            likes: likes,
            comments: comments,
        };
    } catch (error) {
        console.error(`Error fetching interactions for file ID ${fileId}:`, error);
        throw error;
    }
};


/**
 * Function to interact with a file (like or comment).
 * @param fileId - The ID of the file to interact with.
 * @param interactionType - The type of interaction (e.g., "like", "comment").
 * @param comment - (Optional) Comment text for the interaction.
 * @returns The created or updated interaction object, or an error message if status code is 400 and interactionType is "like".
 */
export const interact = async (
    fileId: number | undefined,
    interactionType: "like" | "comment",
    comment?: string
): Promise<FileInteraction | string> => {
    // Check if the fileId is valid
    if (!fileId) {
        throw new Error("fileId is required and must not be undefined. Please ensure a valid file ID is provided.");
    }

    try {
        const requestData = { interaction_type: interactionType, comment };

        const response = await apiRequest<FileInteraction>(`file/${fileId}/interact/`, {
            method: "POST",
            data: requestData,
        });

        console.log("Interaction response:", response.data);
        return response.data;
    } catch (error: unknown) {
        // Check if the error is an Axios error and matches the specific status code
        if (
            axios.isAxiosError(error) &&
            error.response &&
            error.response.status === 400 &&
            interactionType === "like"
        ) {
            console.error("Bad request while liking:", error.response.data.error);
            return error.response.data.error; // Return the error message
        }

        console.error(`Error interacting with file ID ${fileId}:`, error);
        throw error; // Throw the error if it does not match the specific conditions
    }
};


/**
 * Function to delete a specific interaction for a given file.
 * @param fileId - The ID of the file for which the interaction needs to be deleted.
 * @param interactionId - The unique ID of the interaction to delete.
 * @param interactionType - The type of the interaction to delete (e.g., "like", "comment").
 * @returns A success message on successful deletion or throws an error otherwise.
 */
export const deleteInteraction = async (
    fileId: number | undefined,
    interactionId: number,
    interactionType: "like" | "comment"
): Promise<string> => {
    // Validate required parameters
    if (!fileId || !interactionId) {
        throw new Error("fileId and interactionId parameters are required.");
    }

    if (interactionType !== "like" && interactionType !== "comment") {
        throw new Error("Invalid interaction type. Must be 'like' or 'comment'.");
    }

    try {
        // Make a DELETE request to the backend with the interaction ID and type
        const response: AxiosResponse<{ message: string }> = await apiRequest(`file/${fileId}/delete_interaction/`, {
            method: "DELETE",
            data: {
                interaction_id: interactionId,
                interaction_type: interactionType,
            },
        });

        // Return success message from the response
        console.log(`Interaction (ID: ${interactionId}) deleted successfully:`, response.data.message);
        return response.data.message;
    } catch (error: unknown) {
        // Handle errors gracefully
        console.error(`Error deleting interaction (ID: ${interactionId}):`, error);

        // Handle Axios error
        if (axios.isAxiosError(error)) {
            const errorMessage = error.response?.data?.error ?? "An unknown error occurred.";
            throw new Error(errorMessage);
        }

        // Throw unknown error
        throw new Error("Unexpected error occurred while deleting the interaction.");
    }
};


/**
 * Function to delete a file by its ID.
 * @param fileId - The ID of the file to be deleted.
 * @returns A success message if the file is successfully deleted, otherwise throws an error.
 */
export const deleteFile = async (fileId: number | undefined): Promise<string> => {
    // Validate that the fileId is provided
    if (!fileId) {
        throw new Error("fileId is required and must not be undefined.");
    }

    // Make a DELETE request to the backend
    const response = await apiRequest(`file/${fileId}/`, {
        method: "DELETE",
    });

    // Handle specific errors (e.g., 403 Forbidden)
    if (response.status === 403) {
        throw new Error("You do not have permission to delete this file.");
    }

    // Check if the response status is 204 (success, no content)
    if (response.status === 204) {
        console.log(`File with ID ${fileId} deleted successfully.`);
        return `File with ID ${fileId} has been successfully deleted.`;
    } else {
        throw new Error("Failed to delete file.");
    }


};