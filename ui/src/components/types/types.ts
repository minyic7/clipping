export interface Item {
    type: string;
    height: number;
    width: number;
}

export interface MediaItem extends Item {
    type: 'image' | 'video';
    src: string;
    title: string;
    description: string;
}

