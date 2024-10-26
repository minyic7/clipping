import React, { useState } from 'react';
import '@/components/common/card/MediaCard.less';

interface MediaCardProps {
    type: 'image' | 'video';
    src: string;
    title: string;
    description: string;
    width: string | number; // Accepting width as a prop
}

const MediaCard: React.FC<MediaCardProps> = ({ type, src, title, description, width }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className="media-card flexmasonry-item"
            style={{ width: typeof width === 'number' ? `${width}px` : width }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {type === 'image' ? (
                <img src={src} alt={title} className="media" style={{ width: '100%' }} />
            ) : (
                <video controls className="media" style={{ width: '100%' }}>
                    <source src={src} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            )}
            <div className={`media-info ${hovered ? 'hovered' : ''}`}>
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
        </div>
    );
};

export default MediaCard;