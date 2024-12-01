import React, { useRef, useCallback } from "react";
import "./UploadFileTab.less"; // Import the LESS stylesheet
import Masonry from "@/components/common/masonry/Masonry"; // Import the Masonry component
import { Item, MediaItem } from "@/components/types/types";
import { Button } from "antd"; // Import Ant Design components
import { CloseCircleOutlined } from '@ant-design/icons'; // Import Close Icon
import { getPreSignedUrls, postUploadedItems } from "@/services/services";
import { PresignedUrlResponse, UploadStatus } from "@/services/types";
import axios from "axios";

interface UploadFileTabProps {
    items: Item[];
    setItems: React.Dispatch<React.SetStateAction<Item[]>>;
    invalidFiles: string[];
    setInvalidFiles: React.Dispatch<React.SetStateAction<string[]>>;
    uploadStatuses: UploadStatus[];
    setUploadStatuses: React.Dispatch<React.SetStateAction<UploadStatus[]>>;
}

const UploadFileTab: React.FC<UploadFileTabProps> = ({
                                                         items,
                                                         setItems,
                                                         invalidFiles,
                                                         setInvalidFiles,
                                                         uploadStatuses,
                                                         setUploadStatuses
                                                     }) => {
    const dropzoneRef = useRef<HTMLDivElement>(null);

    const isImageOrVideo = (file: File) => {
        return file.type.startsWith("image/") || file.type.startsWith("video/");
    };

    const getImageDimensions = (file: File): Promise<{ width: number, height: number }> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({ width: img.width, height: img.height });
                if (img.src) {
                    URL.revokeObjectURL(img.src);
                }
            };
            img.onerror = () => {
                reject(new Error('Error loading image'));
            };
            img.src = URL.createObjectURL(file);
        });
    };

    const getVideoDimensions = (file: File): Promise<{ width: number, height: number }> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement("video");
            video.preload = "metadata";
            video.onloadedmetadata = () => {
                resolve({ width: video.videoWidth, height: video.videoHeight });
                URL.revokeObjectURL(video.src);
            };
            video.onerror = () => {
                reject(new Error('Error loading video'));
            };
            video.src = URL.createObjectURL(file);
        });
    };

    const handleDrop = useCallback(async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const droppedFiles = Array.from(event.dataTransfer.files);
        const validFiles = droppedFiles.filter(isImageOrVideo);
        const invalidFiles = droppedFiles.filter(file => !isImageOrVideo(file));

        const newItems: Item[] = await Promise.all(validFiles.map(async (file) => {
            let dimensions = { width: 100, height: 100 }; // Default dimensions
            try {
                if (file.type.startsWith("image/")) {
                    dimensions = await getImageDimensions(file);
                } else if (file.type.startsWith("video/")) {
                    dimensions = await getVideoDimensions(file);
                }
            } catch (error) {
                console.error("Error getting file dimensions:", error);
            }

            const item: MediaItem = {
                file_type: file.type.startsWith("image/") ? "image" : "video",
                height: dimensions.height,
                width: dimensions.width,
                src: URL.createObjectURL(file),
                title: file.name,
                description: "",
                raw: file  // Put the actual file here for uploading later
            };
            return item;
        }));

        setItems(prevItems => [...prevItems, ...newItems]);
        setInvalidFiles(prevInvalidFiles => [
            ...prevInvalidFiles,
            ...invalidFiles.map(file => file.name)
        ]);
    }, [setItems, setInvalidFiles]);

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handleSubmit = async () => {
        try {
            const preSignedUrls: PresignedUrlResponse[] = await getPreSignedUrls(items);
            console.log('Received pre-signed URLs:', preSignedUrls);

            const uploadStatuses: UploadStatus[] = [];
            const remainingItems = [...items]; // Copy of items to keep track during upload

            // Processing items sequentially
            while (remainingItems.length > 0) {
                const item = remainingItems[0];  // Pick the first item
                const preSignedUrl = preSignedUrls.find(url => url.original_object_key === item.title);

                if (!preSignedUrl) {
                    console.error(`Pre-signed URL for item with title ${item.title} not found.`);
                    uploadStatuses.push({ object_key: item.title, status: 'error', errorMessage: 'Pre-signed URL not found' });
                    remainingItems.shift(); // Remove item from the list
                    setItems([...remainingItems]); // Update UI
                    continue;
                }

                try {
                    const response = await axios.put(preSignedUrl.pre_signed_url, item.raw, {
                        headers: {
                            'Content-Type': preSignedUrl.content_type // Explicitly specify the Content-Type header
                        },
                        timeout: 5000 // Add a timeout if necessary
                    });

                    // Update the item's object_key with the unique_object_key from the response
                    const uploadedItem = { ...item, object_key: preSignedUrl.unique_object_key };

                    // Mark the status as success and store the HTTP status code, response message, and item
                    uploadStatuses.push({
                        object_key: preSignedUrl.unique_object_key,
                        status: 'success',
                        uploaded_file: uploadedItem,
                        httpStatusCode: response.status,
                        responseMessage: response.statusText
                    });

                    console.log(`Item with title ${item.title} uploaded successfully.`);
                } catch (error) {
                    if (axios.isAxiosError(error)) {
                        console.log('Axios error', error);
                        const httpStatusCode = error.response?.status;
                        const responseMessage = error.response?.statusText;
                        const errorCode = error.code;
                        const errorMessage = error.message;

                        console.error(`Axios Error uploading item with key ${preSignedUrl.unique_object_key}:`, error);

                        uploadStatuses.push({
                            object_key: preSignedUrl.unique_object_key,
                            status: 'error',
                            httpStatusCode,
                            responseMessage,
                            errorCode,
                            errorMessage
                        });
                    } else {
                        console.error(`Unknown error uploading item with key ${preSignedUrl.unique_object_key}:`, error);

                        uploadStatuses.push({
                            object_key: preSignedUrl.unique_object_key,
                            status: 'error',
                            errorMessage: 'Unknown error occurred'
                        });
                    }
                }

                // Remove uploaded item from the remainingItems array
                remainingItems.shift(); // Remove the first item
                setItems([...remainingItems]); // Update UI incrementally

                // Update upload statuses incrementally
                setUploadStatuses([...uploadStatuses]);

            }

            // Post all successfully uploaded items
            await postUploadedItems(uploadStatuses);

        } catch (error) {
            console.error('Error during submission:', error);
        }
        console.log(items, 'after2...')
    };

    const handleRemoveItem = (index: number) => {
        setItems(prevItems => {
            // Safely update state and handle possible undefined values
            const updatedItems = prevItems.filter((_, i) => i !== index);
            console.log('Item removed!', updatedItems);
            return updatedItems;
        });
    };

    return (
        <>
            <div
                ref={dropzoneRef}
                className="upload-file-tab"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                {items.length === 0 && (
                    <p className="reminder">
                        Drag images or videos here to upload.
                    </p>
                )}
                <Masonry
                    maxCols={99}
                    minCols={1}
                    maxColWidth={300}
                    minColWidth={100}
                    gap={10}
                    items={items}
                    btnConfig={
                        items.map((_, index) => [
                            {
                                btn: <Button icon={<CloseCircleOutlined />} />,
                                callback: () => handleRemoveItem(index)
                            }
                        ])
                    }
                />
            </div>

            {invalidFiles.length > 0 && (
                <div className="file-list">
                    <h3>Invalid Files</h3>
                    <ul>
                        {invalidFiles.map((fileName, index) => (
                            <li key={index}>{fileName}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="submit-container">
                <Button type="primary" onClick={handleSubmit}>
                    Submit
                </Button>
            </div>

            {uploadStatuses.length > 0 && (
                <div className="file-list">
                    <h3>Upload Statuses</h3>
                    <ul>
                        {uploadStatuses.map((status, index) => (
                            <li key={index}>
                                {`Object Key: ${status.object_key}, Status: ${status.status}`}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
};

export default UploadFileTab;