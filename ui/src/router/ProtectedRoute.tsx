import React from "react";
import { Navigate } from "react-router-dom";
import {getAccessToken} from "@/services/setup.ts";


const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const accessToken = getAccessToken();

    // Redirect to LoginComponent if token does not exist
    if (!accessToken) {
        return <Navigate to="/login" replace />;
    }

    // Token is valid, render the children
    return <>{children}</>;
};

export default ProtectedRoute;