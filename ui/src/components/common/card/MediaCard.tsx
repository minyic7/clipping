import React, { useState } from 'react';
import { Modal, Tag, Spin } from 'antd'; // Import Spin for the loader
import '@/components/common/card/MediaCard.less';
import { MediaItem } from '@/components/types/types.ts';

export interface ButtonConfig {
    btn_key: string;
    btn: React.ReactNode;
}

export interface MediaCardProps extends MediaItem {
    btnConfig?: ButtonConfig[];
}

const MediaCard: React.FC<MediaCardProps> = ({
                                                 file_type,
                                                 src,
                                                 title,
                                                 description,
                                                 width,
                                                 tags,
                                                 btnConfig,
                                                 status = 'idle', // Default status to 'idle'
                                             }) => {
    const [hovered, setHovered] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);


    const handleOpenModal = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening a new modal if closing
        setIsModalVisible(true);
    };

    const handleCloseModal = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent any other click event
        setIsModalVisible(false);
    };

    return (
        <div
            className="media-card flexmasonry-item"
            style={{ width: typeof width === 'number' ? `${width}px` : width }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={handleOpenModal}
        >
            {/* Add overlay with Spin for uploading items */}
            {status === 'uploading' && (
                <div className="media-overlay">
                    <div className="media-spinner">
                        <Spin size="large" />
                    </div>
                </div>
            )}

            {file_type === 'image' ? (
                <img src={src} alt={title} className="media" style={{ width: '100%' }} />
            ) : (
                <video controls className="media" style={{ width: '100%' }}>
                    <source src={src} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            )}

            <div className={`media-info ${hovered ? 'hovered' : ''}`}>
                <h3>{title}</h3>
                <p style={{ marginBottom: '10px' }}>{description}</p>
                {btnConfig && (
                    <div className="top-right-buttons">
                        {btnConfig
                            .filter(({ btn_key }) => btn_key === 'removeItem') // Filter to only include 'removeItem'
                            .map(({ btn }, index) => (
                                <div key={index} className="media-btn">
                                    {btn}
                                </div>
                            ))}
                    </div>
                )}
                {tags && (
                    <div className="tags-container">
                        {tags.map((tag, index) => (
                            <Tag key={index} color="blue">
                                {tag}
                            </Tag>
                        ))}
                    </div>
                )}
            </div>

            <Modal
                open={isModalVisible}
                title={title}
                footer={null}
                onCancel={handleCloseModal}
                destroyOnClose
            >
                {file_type === 'image' ? (
                    <img src={src} alt={title} style={{ width: '100%' }} />
                ) : (
                    <video controls style={{ width: '100%' }}>
                        <source src={src} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                )}
                {description && description.trim() !== '' && <p>{description}</p>}
                {tags && (
                    <div className="tags-container">
                        {tags.map((tag, index) => (
                            <Tag key={index} color="blue">
                                {tag}
                            </Tag>
                        ))}
                    </div>
                )}
                {btnConfig && (
                    <div className="buttons">
                        {btnConfig
                            .filter(({ btn_key }) => btn_key !== 'removeItem') // Filter out 'removeItem'
                            .map(({ btn }, index) => (
                                <div key={index} className="media-btn">
                                    {btn}
                                </div>
                            ))}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MediaCard;