// Import necessary dependencies
import React, { useLayoutEffect, useState, useRef, useCallback } from 'react';
import './Masonry.less';
import MediaCard, {ButtonConfig} from '@/components/common/card/MediaCard.tsx';
import { Item, MediaItem } from '@/components/types/types.ts';
import { calculateColumns, calculateColWidth, MasonryConfig } from './MasonryService.ts';

// Define the properties of the Masonry component
interface MasonryProps {
    maxCols: number;
    minCols: number;
    maxColWidth: number;
    minColWidth: number;
    gap: number;
    items: Item[];
    btnConfig?: Array<ButtonConfig>[]; // Updated: Array of arrays for button configs
}

// Masonry component definition
const Masonry: React.FC<MasonryProps> = ({ maxCols, minCols, maxColWidth, minColWidth, gap, items, btnConfig }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [numCols, setNumCols] = useState<number>(minCols);
    const [colWidth, setColWidth] = useState<number>(minColWidth);
    const [columns, setColumns] = useState<number[][]>([]);

    // Function to update the number of columns and column width based on the container width
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

    // Set up event listeners for initial calculation and window resize
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

    // Function to distribute items into columns based on their heights and the column configuration
    const distributeItems = (items: Item[], colWidth: number, numCols: number, gap: number) => {
        const columnHeights: number[] = Array(numCols).fill(0);
        const columns: number[][] = Array.from({ length: numCols }, () => []);

        items.forEach((item, index) => {
            // Ensure item has width and height defined with fallback values
            const itemWidth = item.width ?? 1;
            const itemHeight = item.height ?? 1;

            // Calculate the scaled height based on the colWidth
            const scaledHeight = (colWidth / itemWidth) * itemHeight + gap;

            // Find the column with the least height
            const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));

            // Add the scaled height to the column's total height
            columnHeights[shortestColumnIndex] += scaledHeight;

            // Add the item index to the column's array
            columns[shortestColumnIndex].push(index);
        });

        return columns;
    };

    // Distribute items whenever numCols, colWidth, or items change
    useLayoutEffect(() => {
        const distributedColumns = distributeItems(items, colWidth, numCols, gap);
        setColumns(distributedColumns);
    }, [numCols, colWidth, items, gap]);

    // Render the masonry layout
    return (
        <div ref={containerRef} className="masonry" style={{ gap: `${gap}px` }}>
            {columns.map((column, colIndex) => (
                <div key={`masonry-column-${colIndex}`} className="masonry-column" style={{ gap: `${gap}px` }}>
                    {column.map(itemIndex => {
                        const item = items[itemIndex];
                        if (!item) return null; // Handle edge case

                        // Ensure item has width and height defined with fallback values
                        const itemWidth = item.width ?? 1;
                        const itemHeight = item.height ?? 1;
                        const scaledHeight = (colWidth / itemWidth) * itemHeight;

                        // Render MediaCard or default item view based on file type
                        if (item.file_type === 'image' || item.file_type === 'video') {
                            const mediaItem = item as MediaItem;
                            return (
                                <div key={`masonry-item-${colIndex}-${itemIndex}`}>
                                    <MediaCard
                                        file_type={mediaItem.file_type}
                                        src={mediaItem.src}
                                        title={mediaItem.title}
                                        description={mediaItem.description}
                                        width={colWidth}
                                        tags={mediaItem.tags}
                                        btnConfig={btnConfig?.[itemIndex]} // Pass btnConfig for each specific item
                                        status={mediaItem.status}
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

// Export the Masonry component
export default Masonry;