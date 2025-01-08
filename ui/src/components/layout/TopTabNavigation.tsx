import React, { useState, useEffect } from 'react';
import '@/components/layout/TopTabNavigation.less';
import GalleryTab from "@/components/layout/gallery/GalleryTab.tsx";
import UploadFileTab from "@/components/layout/upload/UploadFileTab.tsx";
import { Item, MediaItem } from "@/components/types/types.ts";
import { UploadStatus } from "@/services/types.ts";
import { fetchItems, fetchMoreItems } from "@/services/services.ts";
import { Spin } from 'antd';
import ClipboardComponent from "@/components/board/ClipboardComponent.tsx";

const TopTabNavigation: React.FC = () => {
    // States for Dark Mode and Tab Navigation
    const [darkMode, setDarkMode] = useState(false);
    const [activeTab, setActiveTab] = useState('1');

    // States for Gallery Tab
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [isEndOfList, setIsEndOfList] = useState(false); // For infinite scrolling
    const [nextUrl, setNextUrl] = useState<string | null>(null);

    // Loading States
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    // States for Upload Tab
    const [items, setItems] = useState<Item[]>([]);
    const [invalidFiles, setInvalidFiles] = useState<string[]>([]);
    const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);

    // -------------------------------
    // FETCH INITIAL GALLERY ITEMS
    // -------------------------------
    useEffect(() => {
        const fetchInitialMediaItems = async () => {
            setIsInitialLoading(true);
            try {
                const { items, next } = await fetchItems();
                setMediaItems(items as MediaItem[]);
                setNextUrl(next || null);
                setIsEndOfList(!next); // If next is null, end of the list
            } catch (error) {
                console.error("Error fetching media items:", error);
            } finally {
                setIsInitialLoading(false);
            }
        };

        fetchInitialMediaItems();
    }, []);

    // -------------------------------
    // MANAGE DARK MODE
    // -------------------------------
    useEffect(() => {
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const updateDarkMode = (isDark: boolean) => {
            setDarkMode(isDark);
            document.body.classList.toggle('dark-mode', isDark);
        };

        updateDarkMode(darkModeMediaQuery.matches); // Initial check
        const handleChange = (e: MediaQueryListEvent) => updateDarkMode(e.matches);

        darkModeMediaQuery.addEventListener('change', handleChange);
        return () => darkModeMediaQuery.removeEventListener('change', handleChange);
    }, []);

    // -------------------------------
    // HANDLE INFINITE SCROLLING
    // -------------------------------
    useEffect(() => {
        const handleScroll = async () => {
            const isBottom =
                window.innerHeight + window.scrollY >= document.documentElement.scrollHeight;

            if (!isFetchingMore && isBottom && nextUrl) {
                setIsFetchingMore(true);
                try {
                    const { items: newItems, next } = await fetchMoreItems(nextUrl);
                    const uniqueItems = newItems.filter(
                        (item) => !mediaItems.some((existing) => existing.object_key === item.object_key)
                    );

                    setMediaItems((prev) => [...prev, ...uniqueItems] as MediaItem[]); // Append new items
                    setNextUrl(next || null);
                    setIsEndOfList(!next);
                } catch (error) {
                    console.error("Error fetching more media items:", error);
                } finally {
                    setIsFetchingMore(false);
                }
            }
        };

        const debounce = (func: () => void, delay: number) => {
            let timeout: NodeJS.Timeout;
            return () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => func(), delay);
            };
        };

        const debouncedScroll = debounce(handleScroll, 200);
        window.addEventListener('scroll', debouncedScroll);
        return () => window.removeEventListener('scroll', debouncedScroll);
    }, [isFetchingMore, nextUrl, mediaItems]);

    // -------------------------------
    // HANDLERS AND UI
    // -------------------------------
    const renderTabContent = () => {
        switch (activeTab) {
            case '1':
                return (
                    <div id="gallery-tab-content">
                        {isInitialLoading ? (
                            <Spin />
                        ) : (
                            <GalleryTab
                                mediaItems={mediaItems}
                                isFetchingMore={isFetchingMore}
                                isEndOfList={isEndOfList}
                            />
                        )}
                    </div>
                );
            case '2':
                return (
                    <ClipboardComponent />
                );
            case '3':
                return (
                    <UploadFileTab
                        items={items}
                        setItems={setItems}
                        invalidFiles={invalidFiles}
                        setInvalidFiles={setInvalidFiles}
                        uploadStatuses={uploadStatuses}
                        setUploadStatuses={setUploadStatuses}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div id="top-tab-navigation" className={darkMode ? 'dark-mode-tabs' : 'light-mode-tabs'}>
            <div className="tab-buttons">
                <button
                    className={activeTab === '1' ? 'active' : ''}
                    onClick={() => setActiveTab('1')}
                >
                    Gallery
                </button>
                <button
                    className={activeTab === '2' ? 'active' : ''}
                    onClick={() => setActiveTab('2')}
                >
                    Tools
                </button>
                <button
                    className={activeTab === '3' ? 'active' : ''}
                    onClick={() => setActiveTab('3')}
                >
                    Upload
                </button>
            </div>
            <div className="tab-content-container">{renderTabContent()}</div>
        </div>
    );
};

export default TopTabNavigation;