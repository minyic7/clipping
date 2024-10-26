// src/components/navigation/TopTabNavigation.tsx

import React, { useState, useEffect } from 'react';
import '@/components/layout/TopTabNavigation.less';
import GalleryTab from "@/components/layout/gallery/GalleryTab.tsx";
import UploadFileTab from "@/components/layout/upload/UploadFileTab.tsx";


const TopTabNavigation: React.FC = () => {
    const [darkMode, setDarkMode] = useState(false);
    const [activeTab, setActiveTab] = useState('1');

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

    const renderTabContent = () => {
        switch (activeTab) {
            case '1':
                return <GalleryTab />;
            case '2':
                return <div>Tools Content</div>;
            case '3':
                return <UploadFileTab />;
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
            </div>
        </div>
    );
};

export default TopTabNavigation;