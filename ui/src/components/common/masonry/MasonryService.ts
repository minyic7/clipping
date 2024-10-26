// src/components/common/masonry/masonryService.ts

export interface MasonryConfig {
    maxCols: number;
    minCols: number;
    maxColWidth: number;
    minColWidth: number;
    gap: number;
}

export const calculateColumns = (config: MasonryConfig, containerWidth: number): number => {
    const { maxCols, minCols, maxColWidth, gap } = config;

    // Calculate possible columns considering minColWidth and gaps
    let calculatedCols = Math.floor((containerWidth + gap) / (maxColWidth + gap));

    // Ensure calculatedCols adheres to the constraints
    calculatedCols = Math.min(calculatedCols, maxCols);
    calculatedCols = Math.max(calculatedCols, minCols);

    return calculatedCols;
};

export const calculateColWidth = (config: MasonryConfig, containerWidth: number, numCols: number): number => {
    const { minColWidth, maxColWidth, gap } = config;
    let colWidth = (containerWidth - (numCols - 1) * gap) / numCols;

    if (colWidth > maxColWidth) {
        colWidth = maxColWidth;
    } else if (colWidth < minColWidth) {
        colWidth = minColWidth;
    }

    return colWidth;
};