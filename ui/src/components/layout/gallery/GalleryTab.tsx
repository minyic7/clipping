import React, { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store.ts";
import { deleteMediaItem, fetchGalleryItems, fetchMoreGalleryItems } from "@/store/slices/gallerySlice.ts";
import Masonry from "@/components/common/masonry/Masonry.tsx";
import { Button, message, Modal, Spin } from "antd";
import "./GalleryTab.less";
import InteractionComponent from "@/components/common/Interaction/InteractionComponent.tsx";
import { DeleteOutlined } from "@ant-design/icons";
import { getUserID } from "@/services/setup.ts";
import { MediaItem } from "@/components/types/types.ts";

const GalleryTab: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();

    // Select state from Redux store
    const { mediaItems, isFetchingMore, isEndOfList, isLoadingInitial, nextUrl, searchTerm } = useSelector(
        (state: RootState) => state.gallery
    );

    const loggedInUserId = parseInt(getUserID() || "-1", 10);

    // Fetch media items on component mount
    useEffect(() => {
        dispatch(fetchGalleryItems());
    }, [dispatch]);

    // ✅ Filter media items dynamically from Redux state based on `searchTerm`
    const filteredMediaItems = mediaItems.filter((item) => {
        if (!searchTerm.trim()) return true;

        const searchLower = searchTerm.toLowerCase();
        return (
            (item.title && item.title.toLowerCase().includes(searchLower)) ||
            (item.description && item.description.toLowerCase().includes(searchLower)) ||
            (item.file_caption && item.file_caption.toLowerCase().includes(searchLower)) || // Include file_caption search
            (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(searchLower)))
        );
    });

    // ✅ Wrap `handleDeleteFile` in `useCallback`
    const handleDeleteFile = useCallback(
        async (fileId: number | undefined) => {
            if (!fileId) {
                console.error("fileId is required and must not be undefined.");
                return;
            }

            Modal.confirm({
                title: "Are you sure you want to delete this file?",
                content: "Once deleted, this action cannot be undone!",
                okText: "Delete",
                cancelText: "Cancel",
                okType: "danger",
                onOk: async () => {
                    try {
                        await dispatch(deleteMediaItem(fileId)).unwrap();
                        message.success("File deleted successfully.");
                    } catch (error) {
                        console.error("Error deleting file:", error);
                        message.error("Failed to delete the file. Please try again.");
                    }
                },
            });
        },
        [dispatch]
    );

    // Infinite scroll handler
    const handleInfiniteScroll = useCallback(() => {
        // Check if we're near the bottom of the page and loading more content is possible
        if (nextUrl && !isFetchingMore && !isEndOfList) {
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

            if (scrollTop + clientHeight >= scrollHeight - 50) {
                dispatch(fetchMoreGalleryItems(nextUrl)); // Load more
            }
        }
    }, [nextUrl, isFetchingMore, isEndOfList, dispatch]);

    // Set up scroll listener
    useEffect(() => {
        window.addEventListener("scroll", handleInfiniteScroll);
        return () => {
            window.removeEventListener("scroll", handleInfiniteScroll);
        };
    }, [handleInfiniteScroll]);

    // Configure action buttons
    const getActionButtons = useCallback(
        (item: MediaItem, index: number) => {
            const buttons = [
                {
                    btn_key: `interactionPanel-${index}`,
                    btn: <InteractionComponent file={item} />,
                },
            ];

            if (item.user_id === loggedInUserId) {
                buttons.push({
                    btn_key: "removeItem",
                    btn: (
                        <Button
                            icon={<DeleteOutlined style={{ color: "red" }} />}
                            onClick={() => handleDeleteFile(item.file_id)}
                        />
                    ),
                });
            }

            return buttons;
        },
        [loggedInUserId, handleDeleteFile]
    );

    return (
        <div className="gallery-tab">
            {isLoadingInitial ? (
                <Spin />
            ) : (
                <>
                    <Masonry
                        maxCols={3}
                        minCols={1}
                        maxColWidth={300}
                        minColWidth={200}
                        gap={16}
                        items={filteredMediaItems}
                        btnConfig={filteredMediaItems.map((item, index) => getActionButtons(item, index))}
                    />

                    <div className="gallery-footer">
                        {isFetchingMore && <Spin />}
                        {!isEndOfList && <p className="scroll-hint">Keep scrolling up for more media...</p>}
                        {isEndOfList && <p>All media items are displayed</p>}
                    </div>
                </>
            )}
        </div>
    );
};

export default GalleryTab;