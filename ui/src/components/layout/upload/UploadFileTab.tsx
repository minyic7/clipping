import React, { useRef, useCallback, useState } from "react";
import "./UploadFileTab.less";
import Masonry from "@/components/common/masonry/Masonry";
import { Item, MediaItem } from "@/components/types/types";
import { Input, Button } from "antd";
import { CloseCircleOutlined } from '@ant-design/icons';
import { getPreSignedUrls, postUploadedItems } from "@/services/services";
import {PresignedUrl, UploadStatus} from "@/services/types";
import axios from "axios";
import TagInput from "@/components/common/tag/TagInput.tsx";

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
    const [bulkTag, setBulkTag] = useState<string>(''); // State to store bulk tag input

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
            const preSignedUrls: PresignedUrl[] = await getPreSignedUrls(items);
            console.log('Received pre-signed URLs:', preSignedUrls);

            const uploadStatuses: UploadStatus[] = [];
            const remainingItems = [...items]; // Copy of items to keep track during upload

            while (remainingItems.length > 0) {
                const item = remainingItems[0];
                const preSignedUrl = preSignedUrls.find(url => url.original_object_key === item.title);

                if (!preSignedUrl) {
                    console.error(`Pre-signed URL for item with title ${item.title} not found.`);
                    uploadStatuses.push({ object_key: item.title, status: 'error', errorMessage: 'Pre-signed URL not found' });
                    remainingItems.shift();
                    setItems([...remainingItems]);
                    continue;
                }

                try {
                    const response = await axios.put(preSignedUrl.pre_signed_url, item.raw, {
                        headers: {
                            'Content-Type': preSignedUrl.content_type
                        },
                        timeout: 360000
                    });

                    const uploadedItem = { ...item, object_key: preSignedUrl.unique_object_key };

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

                remainingItems.shift();
                setItems([...remainingItems]);
                setUploadStatuses([...uploadStatuses]);
            }

            await postUploadedItems(uploadStatuses);

        } catch (error) {
            console.error('Error during submission:', error);
        }
        console.log(items, 'after2...')
    };

    const handleRemoveItem = (index: number) => {
        setItems(prevItems => {
            const updatedItems = prevItems.filter((_, i) => i !== index);
            console.log('Item removed!', updatedItems);
            return updatedItems;
        });
    };

    const handleTagAdd = (index: number, tag: string) => {
        setItems(prevItems => {
            const newItems = [...prevItems];
            newItems[index] = {
                ...newItems[index],
                tags: [...(newItems[index].tags || []), tag],
            };
            return newItems;
        });
    };

    const handleTagRemove = (index: number, tag: string) => {
        setItems(prevItems => {
            const newItems = [...prevItems];
            const currentItem = newItems[index];

            if (currentItem && currentItem.tags) {
                currentItem.tags = currentItem.tags.filter(t => t !== tag);
            }

            return newItems;
        });
    };

    const handleDescriptionChange = (index: number, description: string) => {
        setItems((prevItems) => {
            const newItems = [...prevItems];
            newItems[index] = {
                ...newItems[index],
                description: description,
            };
            return newItems;
        });
    };

    const handleBulkTag = () => {
        if (!bulkTag) return; // Do nothing if bulkTag input is empty

        setItems(prevItems => prevItems.map(item => {
            return {
                ...item,
                tags: Array.isArray(item.tags) ? [...item.tags, bulkTag] : [bulkTag],
            };
        }));

        setBulkTag(''); // Clear the bulk tag input after adding
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
                        items.map((item, index) => [
                            {
                                btn_key: 'removeItem',
                                btn: <Button icon={<CloseCircleOutlined />} onClick={() => handleRemoveItem(index)} />,
                            },
                            {
                                btn_key: 'tagInput',
                                btn: (
                                    <TagInput
                                        tags={item.tags || []}
                                        onTagAdd={(tag) => handleTagAdd(index, tag)}
                                        onTagRemove={(tag) => handleTagRemove(index, tag)}
                                    />
                                ),
                            },
                            {
                                btn_key: 'descriptionInput',
                                btn: (
                                    <Input.TextArea
                                        placeholder="Description"
                                        value={item.description}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleDescriptionChange(index, e.currentTarget.value)}
                                    />
                                ),
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
                <Input
                    placeholder="Enter tag for all items"
                    value={bulkTag}
                    onChange={e => setBulkTag(e.target.value)}
                    style={{ width: '200px', marginRight: '10px' }}
                />
                <Button onClick={handleBulkTag}>
                    Bulk Tag
                </Button>
                <Button type="primary" onClick={handleSubmit} style={{ marginLeft: '10px' }}>
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