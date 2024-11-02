import React, { useState, useEffect, useRef } from 'react';
import '@/components/layout/TopTabNavigation.less';
import GalleryTab from "@/components/layout/gallery/GalleryTab.tsx";
import UploadFileTab from "@/components/layout/upload/UploadFileTab.tsx";
import {Item, MediaItem} from "@/components/types/types.ts";
import {UploadStatus} from "@/services/types.ts";

// Function to fetch more media items
const fetchMoreMediaItems = async (): Promise<MediaItem[]> => {
    // Simulate API call with a timeout
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                { type: 'image', src: 'https://via.placeholder.com/600x400', width: 600, height: 400, title: '11', description: 'New image 1' },
                { type: 'video', src: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', width: 640, height: 360, title: '12', description: 'New video 1' },
                // Add more items here
            ]);
        }, 1000); // Simulates network delay
    });
};

const TopTabNavigation: React.FC = () => {
    const [darkMode, setDarkMode] = useState(false);
    const [activeTab, setActiveTab] = useState('1');
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([
        { type: 'image', src: 'https://via.placeholder.com/600x400', width: 600, height: 400, title: '1', description: 'A regular image with 600x400 dimensions' },
        { type: 'image', src: 'https://via.placeholder.com/300x500', width: 300, height: 500, title: '2', description: 'A tall image with 300x500 dimensions' },
        { type: 'video', src: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', width: 640, height: 360, title: '3', description: 'Sample video 1' },
        { type: 'image', src: 'https://via.placeholder.com/400x800', width: 400, height: 800, title: '4', description: 'Another tall image with 400x800 dimensions' },
        { type: 'image', src: 'https://via.placeholder.com/800x300', width: 800, height: 300, title: '5', description: 'A wide image with 800x300 dimensions' },
        { type: 'image', src: 'https://via.placeholder.com/200x200', width: 200, height: 200, title: '6', description: 'A small image with 200x200 dimensions' },
        { type: 'image', src: 'https://via.placeholder.com/1000x600', width: 1000, height: 600, title: '7', description: 'A large image with 1000x600 dimensions' },
        { type: 'video', src: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', width: 640, height: 360, title: '8', description: 'A wide video sample' },
        { type: 'image', src: 'https://via.placeholder.com/500x500', width: 500, height: 500, title: '9', description: 'A square image with 500x500 dimensions' },
        { type: 'image', src: 'https://via.placeholder.com/300x900', width: 300, height: 900, title: '10', description: 'A very tall image with 300x900 dimensions' },
    ]);

    const observer = useRef<IntersectionObserver | null>(null);

    // State for UploadFileTab
    const [items, setItems] = useState<Item[]>([]);
    const [invalidFiles, setInvalidFiles] = useState<string[]>([]);
    const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);

    useEffect(() => {
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        // Set initial mode
        setDarkMode(darkModeMediaQuery.matches);
        document.body.classList.toggle('dark-mode', darkModeMediaQuery.matches);

        // Listen for changes to the color scheme
        const handleChange = (e: MediaQueryListEvent) => {
            setDarkMode(e.matches);
            document.body.classList.toggle('dark-mode', e.matches);
        };

        darkModeMediaQuery.addEventListener('change', handleChange);

        // Clean up the event listener
        return () => {
            darkModeMediaQuery.removeEventListener('change', handleChange);
        };
    }, []);

    useEffect(() => {
        if (observer.current) {
            observer.current.disconnect();
        }

        observer.current = new IntersectionObserver(async (entries) => {
            if (entries[0].isIntersecting) {
                // Fetch more media items
                const moreMediaItems = await fetchMoreMediaItems();
                setMediaItems(prevItems => [...prevItems, ...moreMediaItems]);
            }
        });

        const bottomElement = document.querySelector("#bottom-of-content");
        if (bottomElement) {
            observer.current.observe(bottomElement);
        }

        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, []);

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
                <div id="bottom-of-content" style={{ height: '1px' }}></div>
            </div>
        </div>
    );
};

export default TopTabNavigation;