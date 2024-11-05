export interface Item {
    object_key?: string | null;
    type: string;
    height: number;
    width: number;
    title: string;
    description: string;
    raw?: object;  // holds the actual file raw if needed, e.g. uploading files
}

export interface MediaItem extends Item {
    type: 'image' | 'video';
    src: string;
}

