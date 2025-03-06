import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {Button, Dropdown, Modal} from "antd";
import { UploadOutlined, AppstoreOutlined, LoginOutlined, UserOutlined } from "@ant-design/icons";
import GallerySearchBar from "@/components/layout/gallery/GallerySearchBar.tsx";
import LoginGuard from "@/components/common/login/LoginGuard.tsx";
import UploadFileTab from "@/components/layout/upload/UploadFileTab.tsx";
import { Item } from "@/components/types/types.ts";
import { UploadStatus } from "@/services/types.ts";
import "./AppHeader.less";
import {useAppDispatch, useAppSelector} from "@/store/hook.ts";
import {logoutUser} from "@/store/slices/userSlice.ts"; // Ensure you have styles

const AppHeader: React.FC = () => {
    // State for Upload Tab
    const [items, setItems] = useState<Item[]>([]);
    const [invalidFiles, setInvalidFiles] = useState<string[]>([]);
    const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);

    // State for controlling the modal
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Handlers for opening and closing the modal
    const showModal = () => setIsModalVisible(true);
    const handleCloseModal = () => setIsModalVisible(false);

    // Redux state for user data
    const { username, isGuestUser } = useAppSelector((state) => state.user);
    const dispatch = useAppDispatch();

    const profileMenu = {
        items: [
            // {
            //     key: 'profile',
            //     label: <NavLink to="/profile">Profile</NavLink>,  // TODO: make a seperate profile componenet
            // },
            {
                key: 'logout',
                label: <div onClick={() => dispatch(logoutUser())}>Logout</div>,
            },
        ],
    };

    return (
        <>
            <header className="app-header">
                {/* Gallery Button */}
                <NavLink to="/gallery" className="album-button">
                    <AppstoreOutlined className="album-icon" />
                    Gallery
                </NavLink>

                {/* Search Bar */}
                <div className="search-container">
                    <GallerySearchBar />
                </div>

                {/* Upload Button with Login Guard */}
                <LoginGuard reminderMessage="Login Required To Upload" onAuthSuccess={showModal}>
                    <Button className="upload-button-icon" type="text" icon={<UploadOutlined />}>
                        Upload Files
                    </Button>
                </LoginGuard>

                {/* Show Login or User Profile */}
                {isGuestUser ? (
                    // Show the Login Button for Guest Users
                    <NavLink to="/login" className="login-button">
                        <LoginOutlined className="login-icon" />
                        Login
                    </NavLink>
                ) : (
                    // Show the Username and Profile Dropdown for Logged-In Users
                    // TODO: a placeholder for user dp
                    <Dropdown
                        menu={profileMenu}
                        placement="bottomRight"
                        trigger={['click']}
                    >
                        <div className="user-info">
                            <div className="user-avatar">
                                <UserOutlined />
                            </div>
                            <span className="username">{username}</span>
                        </div>
                    </Dropdown>
                )}
            </header>

            {/* Upload Modal (Now inside AppHeader) */}
            <Modal
                title="Upload Files"
                open={isModalVisible}
                onCancel={handleCloseModal}
                footer={null}
                width={Math.max(window.innerWidth / 2, 800)}
            >
                <UploadFileTab
                    items={items}
                    setItems={setItems}
                    invalidFiles={invalidFiles}
                    setInvalidFiles={setInvalidFiles}
                    uploadStatuses={uploadStatuses}
                    setUploadStatuses={setUploadStatuses}
                />
            </Modal>
        </>
    );
};

export default AppHeader;
