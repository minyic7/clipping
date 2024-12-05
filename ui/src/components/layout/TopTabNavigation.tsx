import React, { useState, useEffect } from 'react';
import '@/components/layout/TopTabNavigation.less';
import GalleryTab from "@/components/layout/gallery/GalleryTab.tsx";
import UploadFileTab from "@/components/layout/upload/UploadFileTab.tsx";
import { Item, MediaItem } from "@/components/types/types.ts";
import { UploadStatus } from "@/services/types.ts";
import { fetchItems, fetchMoreItems } from "@/services/services.ts";

const TopTabNavigation: React.FC = () => {
    const [darkMode, setDarkMode] = useState(false);
    const [activeTab, setActiveTab] = useState('1');
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [isEndOfList, setIsEndOfList] = useState(false);
    const [nextUrl, setNextUrl] = useState<string | null>(null);
    const [lastFetchedUrl, setLastFetchedUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // State for UploadFileTab
    const [items, setItems] = useState<Item[]>([]);
    const [invalidFiles, setInvalidFiles] = useState<string[]>([]);
    const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);

    useEffect(() => {
        const fetchInitialMediaItems = async () => {
            setIsLoading(true);
            try {
                const { items, next } = await fetchItems();
                setMediaItems(items as MediaItem[]);
                setNextUrl(next || null);
                setIsEndOfList(!next); // End of list if no next URL
                setLastFetchedUrl('file/')
            } catch (error) {
                console.error("Error fetching media items:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialMediaItems();
    }, []);

    useEffect(() => {
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        setDarkMode(darkModeMediaQuery.matches);
        document.body.classList.toggle('dark-mode', darkModeMediaQuery.matches);

        const handleChange = (e: MediaQueryListEvent) => {
            setDarkMode(e.matches);
            document.body.classList.toggle('dark-mode', e.matches);
        };

        darkModeMediaQuery.addEventListener('change', handleChange);

        return () => {
            darkModeMediaQuery.removeEventListener('change', handleChange);
        };
    }, []);

    useEffect(() => {
        let isThrottled = false;
        const handleScroll = async () => {
            if (!isLoading && !isThrottled) {
                const scrollPosition = window.innerHeight + window.scrollY;
                const threshold = document.documentElement.scrollHeight;

                console.log('scroll position:', scrollPosition/threshold);

                if (scrollPosition >= threshold) {
                    setIsLoading(true);
                    isThrottled = true;
                    try {
                        setLastFetchedUrl(nextUrl || lastFetchedUrl)
                        const response = await fetchMoreItems(nextUrl || lastFetchedUrl);

                        setNextUrl(response.next || null); // null means end of data
                        if (!response.next) {
                            setIsEndOfList(true); // Mark end of list if no next URL
                        }

                        const newItems = response.items as MediaItem[];

                        // Filter out duplicates
                        const existingKeys = new Set(mediaItems.map(item => item.object_key));
                        const uniqueNewItems = newItems.filter(item => !existingKeys.has(item.object_key));

                        if (uniqueNewItems.length > 0) {
                            setMediaItems(prevItems => [...prevItems, ...uniqueNewItems]);

                        } else if (!response.next) {
                            setIsEndOfList(true); // Also mark end if no items and no next URL
                        }
                    } catch (error) {
                        console.error("Error fetching more media items:", error);
                    } finally {
                        setIsLoading(false);
                        setTimeout(() => {
                            isThrottled = false;
                        }, 3000);
                    }
                }
            }
        };

        const debounceScroll = debounce(handleScroll, 200);
        window.addEventListener('scroll', debounceScroll);

        return () => {
            window.removeEventListener('scroll', debounceScroll);
        };
    });

    function debounce<T extends unknown[]>(func: (...args: T) => void, wait: number): (...args: T) => void {
        let timeout: NodeJS.Timeout;
        return (...args: T) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case '1':
                return <GalleryTab mediaItems={mediaItems} />;
            case '2':
                return <div>Tools Content</div>;
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
        <div id="top-tab-navigation"
             className={`top-tab-navigation ${darkMode ? 'dark-mode-tabs' : 'light-mode-tabs'}`}>

            <div className="tab-buttons">
                <button className={activeTab === '1' ? 'active' : ''} onClick={() => setActiveTab('1')}>Gallery</button>
                <button className={activeTab === '2' ? 'active' : ''} onClick={() => setActiveTab('2')}>Tools</button>
                <button className={activeTab === '3' ? 'active' : ''} onClick={() => setActiveTab('3')}>Upload</button>
            </div>

            <div className="tab-content-container">
                {renderTabContent()}
                {isEndOfList && <p>All images are displayed</p>}
            </div>
        </div>
    );
};

export default TopTabNavigation;