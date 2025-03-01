import { configureStore } from "@reduxjs/toolkit";
import galleryReducer from "@/store/slices/gallerySlice";
import userReducer from "@/store/slices/userSlice";

const store = configureStore({
    reducer: {
        gallery: galleryReducer,
        user: userReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
