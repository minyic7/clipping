import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import { deleteFile, fetchItems, fetchMoreItems } from "@/services/services.ts";
import { Item, MediaItem } from "@/components/types/types.ts";

interface GalleryState {
    mediaItems: MediaItem[];
    isFetchingMore: boolean;
    isLoadingInitial: boolean;
    isEndOfList: boolean;
    nextUrl: string | null;
    error: string | null;
    searchTerm: string; // Add search term here
}

const initialState: GalleryState = {
    mediaItems: [],
    isFetchingMore: false,
    isLoadingInitial: false,
    isEndOfList: false,
    nextUrl: null,
    error: null,
    searchTerm: "", // Initialize searchTerm
};

// ✅ Helper function to filter and validate media items
const validateMediaItems = (items: Item[]): MediaItem[] => {
    return items.filter((item: Item): item is MediaItem =>
        item.file_type === "image" || item.file_type === "video"
    );
};

// ✅ Handle API errors correctly
const handleApiError = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message; // ✅ Extract meaningful error message
    }
    return "An unexpected error occurred."; // ✅ Fallback message
};

// ✅ Redux action to delete a file
export const deleteMediaItem = createAsyncThunk(
    "gallery/deleteMediaItem",
    async (fileId: number, { rejectWithValue }) => {
        try {
            const message = await deleteFile(fileId);
            return { fileId, message };
        } catch (error: unknown) {
            return rejectWithValue(handleApiError(error));
        }
    }
);

// ✅ Fetch gallery items only if mediaItems is empty
export const fetchGalleryItems = createAsyncThunk(
    "gallery/fetchGalleryItems",
    async (_, { getState, rejectWithValue }) => {
        // Narrowed typing avoids circular dependency
        const state = getState() as { gallery: GalleryState };
        const mediaItems = state.gallery.mediaItems;

        // Prevent duplicate fetch when mediaItems already exist
        if (mediaItems.length > 0) {
            return { items: mediaItems, next: state.gallery.nextUrl };
        }

        try {
            const { items, next } = await fetchItems();
            return { items: validateMediaItems(items), next };
        } catch (error: unknown) {
            return rejectWithValue(handleApiError(error));
        }
    }
);

// ✅ Redux action to fetch more gallery items for pagination
export const fetchMoreGalleryItems = createAsyncThunk(
    "gallery/fetchMoreGalleryItems",
    async (nextUrl: string, { rejectWithValue }) => {
        try {
            const { items, next } = await fetchMoreItems(nextUrl);
            return { items: validateMediaItems(items), next };
        } catch (error: unknown) {
            return rejectWithValue(handleApiError(error));
        }
    }
);

// ✅ Slice Definition
const gallerySlice = createSlice({
    name: "gallery",
    initialState,
    reducers: {
        clearError(state) {
            state.error = null;
        },
        // ✅ Add reducer to set search term
        setSearchTerm(state, action: PayloadAction<string>) {
            state.searchTerm = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchGalleryItems.pending, (state) => {
                state.isLoadingInitial = true;
                state.error = null;
            })
            .addCase(fetchGalleryItems.fulfilled, (state, action) => {
                state.isLoadingInitial = false;
                state.mediaItems = action.payload.items;
                state.nextUrl = action.payload.next || null;
                state.isEndOfList = !action.payload.next;
            })
            .addCase(fetchGalleryItems.rejected, (state, action) => {
                state.isLoadingInitial = false;
                state.error = action.payload as string;
            })
            .addCase(fetchMoreGalleryItems.pending, (state) => {
                state.isFetchingMore = true;
                state.error = null;
            })
            .addCase(fetchMoreGalleryItems.fulfilled, (state, action) => {
                state.isFetchingMore = false;
                const newItems = action.payload.items.filter(
                    (item) =>
                        !state.mediaItems.some(
                            (existing) => existing.object_key === item.object_key
                        )
                );
                state.mediaItems.push(...newItems);
                state.nextUrl = action.payload.next || null;
                state.isEndOfList = !action.payload.next;
            })
            .addCase(fetchMoreGalleryItems.rejected, (state, action) => {
                state.isFetchingMore = false;
                state.error = action.payload as string;
            })
            .addCase(deleteMediaItem.fulfilled, (state, action) => {
                state.mediaItems = state.mediaItems.filter(
                    (item) => item.file_id !== action.payload.fileId
                );
            })
            .addCase(deleteMediaItem.rejected, (state, action) => {
                state.error = action.payload as string;
            });
    },
});

// ✅ Export the `setSearchTerm` action
export const { clearError, setSearchTerm } = gallerySlice.actions;
export default gallerySlice.reducer;