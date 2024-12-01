export interface Item {
    object_key?: string | null;
    file_type: string;
    height: number;
    width: number;
    title: string;
    description: string;
    tag?: string;
    raw?: object;  // holds the actual file raw if needed, e.g. uploading files
}

export interface MediaItem extends Item {
    file_type: 'image' | 'video';
    src: string;
}

