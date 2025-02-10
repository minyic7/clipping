import React, { useState, useEffect } from 'react';
import Masonry from '@/components/common/masonry/Masonry.tsx';
import { MediaItem } from '@/components/types/types.ts';
import {Button, Input, message, Modal, Spin} from 'antd';
import './GalleryTab.less';
import InteractionComponent from "@/components/common/Interaction/InteractionComponent.tsx";
import { DeleteOutlined } from "@ant-design/icons";
import { deleteFile } from "@/services/services.ts";
import { getUserID } from "@/services/setup.ts";

const { Search } = Input;

interface GalleryTabProps {
    mediaItems: MediaItem[];
    isFetchingMore: boolean;
    isEndOfList: boolean;
}

const GalleryTab: React.FC<GalleryTabProps> = ({ mediaItems, isFetchingMore, isEndOfList }) => {
    const [filteredMediaItems, setFilteredMediaItems] = useState<MediaItem[]>(mediaItems);
    const [searchTerm, setSearchTerm] = useState<string>("");

    const loggedInUserId = parseInt(getUserID() || "-1", 10); // Convert to integer

    useEffect(() => {
        const applyFilters = () => {
            let filtered = [...mediaItems];

            // Search through the title, description, and tags
            if (searchTerm.trim()) {
                const searchTermLower = searchTerm.toLowerCase();
                filtered = filtered.filter((item) =>
                    (item.title && item.title.toLowerCase().includes(searchTermLower)) ||
                    (item.description && item.description.toLowerCase().includes(searchTermLower)) ||
                    (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(searchTermLower)))
                );
            }

            setFilteredMediaItems(filtered);
        };

        applyFilters();
    }, [searchTerm, mediaItems]);

    const handleSearch = (value: string) => setSearchTerm(value);

    // A wrapper function to handle file deletion
    const handleDeleteFile = async (fileId: number | undefined) => {
        if (!fileId) {
            console.log("fileId is required and must not be undefined.")
        }

        // Show a confirmation pop-up before proceeding
        Modal.confirm({
            title: "Are you sure you want to delete this file?",
            content: "Once deleted, this action cannot be undone!",
            okText: "Delete",
            cancelText: "Cancel",
            okType: "danger",
            onOk: async () => {
                try {
                    // Call deleteFileFromAPI to delete the file
                    const successMessage = await deleteFile(fileId);

                    // Update the state to remove the deleted file
                    const updatedMediaItems = filteredMediaItems.filter(
                        (item) => item.file_id !== fileId
                    );
                    setFilteredMediaItems(updatedMediaItems);

                    // If mediaItems is maintained globally, update that too
                    const updatedOriginalItems = mediaItems.filter(
                        (item) => item.file_id !== fileId
                    );

                    // Set globally scoped items as well to stay in sync
                    setFilteredMediaItems(updatedOriginalItems);

                    // Show success message to the user
                    message.success(successMessage);
                } catch (error) {
                    console.error("Error deleting file:", error);
                    message.error(
                        "Failed to delete the file. Please try again or contact support."
                    );
                }
            },
        });
    };

    return (
        <div className="gallery-tab">
            <div className="search-and-popular-tags">
                <Search
                    placeholder="Search by tag, title, or description"
                    onSearch={handleSearch}
                    onChange={(e) => handleSearch(e.target.value)}
                    allowClear
                    value={searchTerm}
                    style={{ marginBottom: 16, width: '100%' }}
                />
            </div>

            <Masonry
                maxCols={3}
                minCols={1}
                maxColWidth={300}
                minColWidth={200}
                gap={16}
                items={filteredMediaItems}
                btnConfig={
                    filteredMediaItems.map((item, index) => {
                        // Start configuring dynamic button actions
                        const buttons = [
                            {
                                btn_key: `interactionPanel-${index}`, // Fixed btn_key template syntax
                                btn: <InteractionComponent file={item} />, // Ensure proper file prop structure
                            },
                        ];

                        // Add the 'removeItem' button only if the user owns the item
                        if (item.user_id === loggedInUserId) {
                            buttons.push({
                                btn_key: 'removeItem',
                                btn: (
                                    <Button
                                        icon={<DeleteOutlined style={{ color: "red" }} />}
                                        onClick={() => handleDeleteFile(item.file_id)}
                                    />
                                ),
                            });
                        }

                        return buttons;
                    })
                }
            />

            <div className="gallery-footer">
                {isFetchingMore ? (
                    <Spin />
                ) : (
                    isEndOfList && <p>All images are displayed</p>
                )}
            </div>
        </div>
    );
};

export default GalleryTab;