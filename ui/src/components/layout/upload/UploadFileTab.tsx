import React, { useState, useRef, useCallback } from "react";
import "./UploadFileTab.less"; // Import the LESS stylesheet
import Masonry from "@/components/common/masonry/Masonry.tsx"; // Import the Masonry component
import { Item, MediaItem } from "@/components/types/types.ts";
import { Button } from "antd"; // Assuming you're using Ant Design. Adjust as necessary.

const UploadFileTab: React.FC = () => {
    const dropzoneRef = useRef<HTMLDivElement>(null);
    const [items, setItems] = useState<Item[]>([]);
    const [invalidFiles, setInvalidFiles] = useState<string[]>([]);

    const isImageOrVideo = (file: File) => {
        return file.type.startsWith("image/") || file.type.startsWith("video/");
    };

    const getImageDimensions = (file: File): Promise<{ width: number, height: number }> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                resolve({ width: img.width, height: img.height });
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

        const newItems: Item[] = await Promise.all(validFiles.map(async (file, _) => {
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
                type: file.type.startsWith("image/") ? "image" : "video",
                height: dimensions.height,
                width: dimensions.width,
                src: URL.createObjectURL(file),
                title: file.name,
                description: ""
            };
            return item;
        }));

        setItems(prevItems => [...prevItems, ...newItems]);
        setInvalidFiles(prevInvalidFiles => [
            ...prevInvalidFiles,
            ...invalidFiles.map(file => file.name)
        ]);
    }, []);

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handleSubmit = () => {
        // Handle submit logic here
        console.log("Submit clicked!", items);
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
        </>
    );
};

export default UploadFileTab;