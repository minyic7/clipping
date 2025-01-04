import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
} from "react-router-dom";
import App from "@/App.tsx";
import LoginComponent from "@/components/common/login/LoginComponent.tsx";
import ProtectedRoute from "@/router/ProtectedRoute.tsx";

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route>
            {/* Public route for the Login page */}
            <Route path="/login" element={<LoginComponent />} />

            {/* Protected route for your main app */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <App /> {/* Your main app */}
                    </ProtectedRoute>
                }
            />
        </Route>
    )
);

export default router;