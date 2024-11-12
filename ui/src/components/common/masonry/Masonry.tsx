import React, { useLayoutEffect, useState, useRef, useCallback } from 'react';
import './Masonry.less';
import MediaCard from '@/components/common/card/MediaCard.tsx';
import { Item, MediaItem } from '@/components/types/types.ts';
import { calculateColumns, calculateColWidth, MasonryConfig } from './MasonryService.ts';

interface MasonryProps {
    maxCols: number;
    minCols: number;
    maxColWidth: number;
    minColWidth: number;
    gap: number;
    items: Item[];
    btnConfig?: Array<{ btn: React.ReactNode; callback: () => void }>[]; // Updated: Array of arrays for button configs
}

const Masonry: React.FC<MasonryProps> = ({ maxCols, minCols, maxColWidth, minColWidth, gap, items, btnConfig }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [numCols, setNumCols] = useState<number>(minCols);
    const [colWidth, setColWidth] = useState<number>(minColWidth);
    const [columns, setColumns] = useState<number[][]>([]);

    const updateColumns = useCallback(() => {
        if (containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth;
            const config: MasonryConfig = { maxCols, minCols, maxColWidth, minColWidth, gap };
            const calculatedCols = calculateColumns(config, containerWidth);
            setNumCols(calculatedCols);
            const calculatedColWidth = calculateColWidth(config, containerWidth, calculatedCols);
            setColWidth(calculatedColWidth);
        }
    }, [maxCols, minCols, maxColWidth, minColWidth, gap]);

    useLayoutEffect(() => {
        // Initial column calculation
        updateColumns();

        // Update columns on window resize
        window.addEventListener('resize', updateColumns);

        // Cleanup event listener on component unmount
        return () => {
            window.removeEventListener('resize', updateColumns);
        };
    }, [updateColumns]);

    // Initialize an array for column heights and an array of arrays for item indices
    const distributeItems = (items: Item[], colWidth: number, numCols: number, gap: number) => {
        const columnHeights: number[] = Array(numCols).fill(0);
        const columns: number[][] = Array.from({ length: numCols }, () => []);

        items.forEach((item, index) => {
            // Calculate the scaled height based on the colWidth
            const scaledHeight = (colWidth / item.width) * item.height + gap;

            // Find the column with the least height
            const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));

            // Add the scaled height to the column's total height
            columnHeights[shortestColumnIndex] += scaledHeight;

            // Add the item index to the column's array
            columns[shortestColumnIndex].push(index);
        });

        return columns;
    };

    useLayoutEffect(() => {
        // Distribute media items into columns whenever numCols, colWidth, or items change
        const distributedColumns = distributeItems(items, colWidth, numCols, gap);
        setColumns(distributedColumns);
    }, [numCols, colWidth, items, gap]);

    return (
        <div ref={containerRef} className="masonry" style={{ gap: `${gap}px` }}>
            {columns.map((column, colIndex) => (
                <div key={`masonry-column-${colIndex}`} className="masonry-column" style={{ gap: `${gap}px` }}>
                    {column.map(itemIndex => {
                        const item = items[itemIndex];
                        if (!item) return null; // handle edge case

                        const scaledHeight = (colWidth / item.width) * item.height;
                        if (item.file_type === 'image' || item.file_type === 'video') {
                            const mediaItem = item as MediaItem;
                            return (
                                <div key={`masonry-item-${colIndex}-${itemIndex}`}>
                                    <MediaCard
                                        type={mediaItem.file_type}
                                        src={mediaItem.src}
                                        title={mediaItem.title}
                                        description={mediaItem.description}
                                        width={colWidth}
                                        btnConfig={btnConfig?.[itemIndex]} // Pass btnConfig for each specific item
                                    />
                                </div>
                            );
                        } else {
                            return (
                                <div
                                    key={`masonry-item-default-${colIndex}-${itemIndex}`}
                                    style={{
                                        width: colWidth,
                                        height: scaledHeight,
                                        backgroundColor: 'lightgrey',
                                    }}
                                >
                                    <p>{item.file_type}</p>
                                </div>
                            );
                        }
                    })}
                </div>
            ))}
        </div>
    );
};

export default Masonry;