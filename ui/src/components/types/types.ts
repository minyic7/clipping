export interface Item {
    type: string;
    height: number;
    width: number;
    title: string;
    description: string;
}

export interface MediaItem extends Item {
    type: 'image' | 'video';
    src: string;
}

