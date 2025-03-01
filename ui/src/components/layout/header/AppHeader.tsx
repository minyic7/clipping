import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { Button, Modal } from "antd";
import { UploadOutlined, AppstoreOutlined, LoginOutlined } from "@ant-design/icons";
import GallerySearchBar from "@/components/layout/gallery/GallerySearchBar.tsx";
import LoginGuard from "@/components/common/login/LoginGuard.tsx";
import UploadFileTab from "@/components/layout/upload/UploadFileTab.tsx";
import { Item } from "@/components/types/types.ts";
import { UploadStatus } from "@/services/types.ts";
import "./AppHeader.less"; // Ensure you have styles

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

                {/* Login Button */}
                <NavLink to="/login" className="login-button">
                    <LoginOutlined className="login-icon" />
                    Login
                </NavLink>
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
