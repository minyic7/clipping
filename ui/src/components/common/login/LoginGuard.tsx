import React, { useState } from "react";
import { Modal } from "antd";
import LoginComponent from "./LoginComponent";
import "./LoginGuard.less";

interface LoginGuardProps {
    reminderMessage: string;
    children: React.ReactNode;
    onAuthSuccess?: () => void;
}

const LoginGuard: React.FC<LoginGuardProps> = ({ reminderMessage, children, onAuthSuccess }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);

    const handleClick = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        const userID = localStorage.getItem("user_id");

        if (!userID || userID === "-1") {
            setIsModalVisible(true);
        } else {
            onAuthSuccess?.();
        }
    };

    const handleLoginSuccess = () => {
        setIsModalVisible(false);
        onAuthSuccess?.();
    };

    const handleGuestLogin = () => {
        setIsModalVisible(false);
    }

    return (
        <>
            <div onClick={handleClick} className="login-guard">
                {children}
            </div>

            <Modal
                title={reminderMessage}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                centered
            >
                <LoginComponent redirectPath="/gallery" onSuccess={handleLoginSuccess} onGuestLogin={handleGuestLogin}/>
            </Modal>
        </>
    );
};

export default LoginGuard;
