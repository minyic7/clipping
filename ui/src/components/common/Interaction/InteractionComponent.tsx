import React, {useState, useEffect, useCallback} from "react";
import {useSelector} from "react-redux";
import {RootState} from "@/store/store.ts"; // Adjust the import to point to your store
import {FileInteractionsSummary, FileComment, Item} from "@/components/types/types";
import {deleteInteraction, fetchInteractions, interact} from "@/services/services";
import {getUserID, getUsername} from "@/services/setup.ts";
import {HeartOutlined, HeartFilled} from "@ant-design/icons";
import {Typography, Spin, Button, Input, Space} from "antd";
import './InteractionComponent.less'

const {Text} = Typography;

// Likes Component
const LikesSection: React.FC<{
    totalLikes: number;
    userLiked: boolean;
    onToggleLike: () => Promise<void>;
    isGuestUser: boolean;
}> = ({totalLikes, userLiked, onToggleLike, isGuestUser}) => {
    return (
        <Space>
            <Button
                className="like-btn"
                shape="circle"
                icon={
                    userLiked ? (
                        <HeartFilled style={{color: "red", fontSize: "16px"}}/>
                    ) : (
                        <HeartOutlined style={{fontSize: "16px"}}/>
                    )
                }
                onClick={onToggleLike}
                disabled={isGuestUser}
            />
            <Text className="likes-count">
                {totalLikes} {totalLikes === 1 ? "Like" : "Likes"}
            </Text>
        </Space>
    );
};

// Comments Component
const CommentsSection: React.FC<{
    comments: FileComment[];
    newComment: string;
    onCommentChange: (value: string) => void;
    onSubmitComment: (e: React.FormEvent) => Promise<void>;
    onDeleteComment: (interactionID: number) => Promise<void>;
    isGuestUser: boolean;
}> = ({comments, newComment, onCommentChange, onSubmitComment, onDeleteComment, isGuestUser}) => {
    // Fetch the user ID saved in local storage using `getUserId()`
    const loggedInUserId = parseInt(getUserID() || "-1", 10); // Convert to integer

    return (
        <div className="comments-section">
            {/* Comments List */}
            <div className="comments-list">
                {comments.length > 0 ? (
                    comments.map((comment) => (
                        <div className="comment-item" key={comment.interaction_id}>
                            {/* User Avatar (Optional) */}
                            <div className="avatar-username">
                                <div className="comment-avatar">
                                    <span className="avatar-placeholder">
                                        {comment.username.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <span className="comment-username">{comment.username}</span>
                            </div>

                            {/* Comment Content */}
                            <div className="comment-content">
                                <div className="comment-header">

                                </div>
                                <div className="comment-description">{comment.comment}</div>
                            </div>
                            {/* Delete Button */}
                            {!isGuestUser && comment.user_id === loggedInUserId && (
                                <Button
                                    type="text"
                                    danger
                                    className="delete-comment-btn"
                                    onClick={() => onDeleteComment(comment.interaction_id)}
                                >
                                    Delete
                                </Button>
                            )}
                            <div className="comment-time">
                                {new Date(comment.created_datetime).toLocaleString()}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-comments">No comments yet.</div>
                )}
            </div>

            {/* Add New Comment Section */}
            <div className="add-comment-section">
                <Input.TextArea
                    className="add-comment-input"
                    rows={3}
                    value={newComment}
                    placeholder="Add a comment..."
                    onChange={(e) => onCommentChange(e.target.value)}
                    disabled={isGuestUser}
                />
                <Button
                    type="primary"
                    onClick={onSubmitComment as React.MouseEventHandler}
                    disabled={isGuestUser || !newComment.trim()}
                    className="submit-comment-btn"
                >
                    Comment
                </Button>
            </div>

            {/* Notification for Guest Users */}
            {isGuestUser ? (
                <a href="/login" className="guest-login-link">
                    Login to like or add a comment.
                </a>
            ) : null}
        </div>
    );
};

// Main InteractionComponent
const InteractionComponent: React.FC<{ file: Item }> = ({file}) => {
    const [totalLikes, setTotalLikes] = useState<number>(0);
    const [userLiked, setUserLiked] = useState<boolean>(false);
    const [comments, setComments] = useState<FileComment[]>(file.file_interactions?.comments || []);
    const [newComment, setNewComment] = useState<string>("");
    const [fileInteractionsSummary, setFileInteractionsSummary] =
        useState<FileInteractionsSummary>();
    const [loading, setLoading] = useState<boolean>(true);

    // Fetch `isGuestUser` from Redux Store
    const isGuestUser = useSelector((state: RootState) => state.user.isGuestUser);
    console.log('isGuestUser', isGuestUser);
    console.log('user_id',  useSelector((state: RootState) => state.user.username))

    const fetchAllInteractions = useCallback(async () => {
        try {
            const userID = parseInt(getUserID() || "-1", 10);
            const fileIntSummary: FileInteractionsSummary = await fetchInteractions(file.file_id);
            setFileInteractionsSummary(fileIntSummary);
            setTotalLikes(fileIntSummary.total_likes);
            setComments(fileIntSummary.comments || []);
            setUserLiked(fileIntSummary.likes.some((like) => like.user_id === userID));
        } catch (error) {
            console.error("Error fetching interactions:", error);
        } finally {
            setLoading(false);
        }
    }, [file.file_id]);

    useEffect(() => {
        fetchAllInteractions();
    }, [fetchAllInteractions]);

    const handleLikeToggle = async () => {
        const updatedLikedState = !userLiked;

        setUserLiked(updatedLikedState);
        setTotalLikes((prev) => (updatedLikedState ? prev + 1 : prev - 1));

        try {
            const userID = parseInt(getUserID() || "-1", 10);
            const interaction = fileInteractionsSummary?.likes.find((like) => like.user_id === userID);
            const interactionID = interaction?.interaction_id ?? -1;

            if (updatedLikedState) {
                await interact(file.file_id, "like");
            } else {
                await deleteInteraction(file.file_id, interactionID, "like");
            }
            await fetchAllInteractions();
        } catch (error) {
            setUserLiked(!updatedLikedState);
            setTotalLikes((prev) => (updatedLikedState ? prev - 1 : prev + 1));
            console.error("Error updating like status:", error);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newComment.trim()) return;

        const newCommentCopy: FileComment = {
            interaction_id: Date.now(),
            interaction_type: "comment",
            user_id: parseInt(getUserID() || "-1", 10),
            username: getUsername() || "guest",
            comment: newComment,
            created_datetime: new Date().toISOString(),
        };

        setComments((prev) => [...prev, newCommentCopy]);
        setNewComment("");

        try {
            await interact(file.file_id, "comment", newComment);
            await fetchAllInteractions();
        } catch (error) {
            setComments((prev) =>
                prev.filter((comment) => comment.interaction_id !== newCommentCopy.interaction_id)
            );
            console.error("Error adding comment:", error);
        }
    };

    const handleDeleteComment = async (interactionID: number) => {
        try {
            // Optimistic UI: Remove the comment immediately
            setComments((prev) => prev.filter((comment) => comment.interaction_id !== interactionID));

            // Perform the deletion via API
            await deleteInteraction(file.file_id, interactionID, "comment");

            // Optionally fetch the latest comments after deletion
            await fetchAllInteractions();
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    };

    if (loading) {
        return (
            <div className="interaction-component">
                <Spin size="large" className="loading-spinner"/>
            </div>
        );
    }

    return (
        <div className="interaction-component">
            {/* Likes Section */}
            <LikesSection
                totalLikes={totalLikes}
                userLiked={userLiked}
                isGuestUser={isGuestUser}
                onToggleLike={handleLikeToggle}
            />

            {/* Comments Section */}
            <CommentsSection
                comments={comments}
                newComment={newComment}
                onCommentChange={setNewComment}
                onSubmitComment={handleCommentSubmit}
                onDeleteComment={handleDeleteComment} // Pass delete handler
                isGuestUser={isGuestUser}
            />
        </div>
    );
};

export default InteractionComponent;