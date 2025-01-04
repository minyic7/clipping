import React, { useState, useEffect } from 'react';
import Masonry from '@/components/common/masonry/Masonry.tsx';
import { MediaItem } from '@/components/types/types.ts';
import { Button, Input, Spin } from 'antd';
import './GalleryTab.less';
import InteractionComponent from "@/components/common/Interaction/InteractionComponent.tsx";

const { Search } = Input;

interface GalleryTabProps {
    mediaItems: MediaItem[];
    isFetchingMore: boolean;
    isEndOfList: boolean;
}

const GalleryTab: React.FC<GalleryTabProps> = ({ mediaItems, isFetchingMore, isEndOfList }) => {
    const [filteredMediaItems, setFilteredMediaItems] = useState<MediaItem[]>(mediaItems);
    const [popularTags, setPopularTags] = useState<{ tag: string; count: number }[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");

    useEffect(() => {
        // Mock fetching popular tags (Replace with API fetch if needed)
        const fetchPopularTags = async () => {
            // Example of fetching tags based on mediaItems input
            const tagCounts = mediaItems.reduce((acc: Record<string, number>, item) => {
                item.tags?.forEach((tag) => {
                    acc[tag] = (acc[tag] || 0) + 1;
                });
                return acc;
            }, {});

            const sortedTags = Object.entries(tagCounts)
                .map(([tag, count]) => ({ tag, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            setPopularTags(sortedTags);
        };

        fetchPopularTags();
    }, [mediaItems]);

    useEffect(() => {
        const applyFilters = () => {
            let filtered = [...mediaItems];

            // Filter by selected tags
            if (selectedTags.length > 0) {
                filtered = filtered.filter((item) =>
                    item.tags?.some((tag) => selectedTags.includes(tag))
                );
            }

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
    }, [selectedTags, searchTerm, mediaItems]);

    const handleTagClick = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const handleClearTags = () => setSelectedTags([]);
    const handleSearch = (value: string) => setSearchTerm(value);

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
                <div className="popular-tags">
                    {popularTags.map((tag) => (
                        <Button
                            key={tag.tag}
                            className={`tag-item ${
                                selectedTags.includes(tag.tag) ? 'selected' : ''
                            }`}
                            onClick={() => handleTagClick(tag.tag)}
                        >
                            {tag.tag}
                        </Button>
                    ))}
                    {selectedTags.length > 0 && (
                        <Button onClick={handleClearTags}>Clear Filters</Button>
                    )}
                </div>
            </div>

            <Masonry
                maxCols={3}
                minCols={1}
                maxColWidth={300}
                minColWidth={200}
                gap={16}
                items={filteredMediaItems}
                btnConfig={
                    filteredMediaItems.map((item, index) => [
                        {
                            btn_key: `InteractionPanel-${index}`, // Fixed btn_key template syntax
                            btn: <InteractionComponent file={item} />, // Ensure proper file prop structure
                        }
                    ])
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