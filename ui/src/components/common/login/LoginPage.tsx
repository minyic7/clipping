import React from "react";
import "./LoginPage.less";
import LoginComponent from "@/components/common/login/LoginComponent.tsx"; // Import the corresponding styles for LoginPage

const LoginPage: React.FC = () => {
    return (
        <div className="login-page">
            <LoginComponent />
        </div>
    );
};

export default LoginPage;