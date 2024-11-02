import React from 'react';
import Masonry from '@/components/common/masonry/Masonry.tsx';
import { MediaItem } from '@/components/types/types.ts';
import './GalleryTab.less';

interface GalleryTabProps {
    mediaItems: MediaItem[];
}

const GalleryTab: React.FC<GalleryTabProps> = ({ mediaItems }) => {
    return (
        <div className="gallery-tab">
            <Masonry
                maxCols={3}
                minCols={1}
                maxColWidth={300}
                minColWidth={200}
                gap={16}
                items={mediaItems}
            />
        </div>
    );
};

export default GalleryTab;