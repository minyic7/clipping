import React from 'react';
import Masonry from '@/components/common/masonry/Masonry.tsx';
import { MediaItem } from '@/components/types/types.ts';
import './GalleryTab.less';  // Import the LESS stylesheet

const GalleryTab: React.FC = () => {
    const mediaItems: MediaItem[] = [
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
    ];

    return (
        <div className="gallery-tab">
            <Masonry maxCols={3} minCols={1} maxColWidth={300} minColWidth={200} gap={16} items={mediaItems} />
        </div>
    );
};

export default GalleryTab;