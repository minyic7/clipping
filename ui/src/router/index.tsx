import {
    createBrowserRouter,
    createRoutesFromElements, Navigate,
    Route,
} from 'react-router-dom';
import App from '@/App.tsx';
import GalleryTab from '@/components/layout/gallery/GalleryTab.tsx';
import LoginPage from "@/components/common/login/LoginPage.tsx";

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route>
            {/* Public route for the Login page */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected route for your main app */}
            <Route
                path="/"
                element={
                    <App />
                }
            >
                <Route path="/" element={<Navigate to="gallery" replace />} />
                <Route path="gallery" element={<GalleryTab />} />
                <Route path="tools" element={<h1>Tools</h1>} />
            </Route>
        </Route>
    )
);

export default router;