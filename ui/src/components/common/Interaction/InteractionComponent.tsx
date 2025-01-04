import React, { useState, useEffect, useCallback } from "react";
import { FileInteractionsSummary, FileComment, Item } from "@/components/types/types";
import { deleteInteraction, fetchInteractions, interact } from "@/services/services";
import { getUserID, getUsername } from "@/services/setup.ts";
import { HeartOutlined, HeartFilled } from "@ant-design/icons";
import { Typography, Spin, Button, Input, Space } from "antd";
import './InteractionComponent.less'

const { Text } = Typography;

// Likes Component
const LikesSection: React.FC<{
    totalLikes: number;
    userLiked: boolean;
    onToggleLike: () => Promise<void>;
}> = ({ totalLikes, userLiked, onToggleLike }) => (
    <Space>
        <Button
            className="like-btn"
            shape="circle"
            icon={userLiked ? <HeartFilled style={{ color: "red" }} /> : <HeartOutlined />}
            onClick={onToggleLike}
        />
        <Text className="likes-count">
            {totalLikes} {totalLikes === 1 ? "Like" : "Likes"}
        </Text>
    </Space>
);

// Comments Component
const CommentsSection: React.FC<{
    comments: FileComment[];
    newComment: string;
    onCommentChange: (value: string) => void;
    onSubmitComment: (e: React.FormEvent) => Promise<void>;
}> = ({ comments, newComment, onCommentChange, onSubmitComment }) => (
    <div className="comments-section">
        {/* Comments List */}
        <div className="comments-list">
            {comments.length > 0 ? (
                comments.map((comment) => (
                    <div className="comment-item" key={comment.interaction_id}>
                        <div className="comment-username">{comment.username}</div>
                        <div className="comment-description">{comment.comment}</div>
                        <div className="comment-time">
                            {new Date(comment.created_datetime).toLocaleString()}
                        </div>
                    </div>
                ))
            ) : (
                <div className="no-comments">No comments yet.</div>
            )}
        </div>

        {/* Add New Comment */}
        <div className="add-comment-section">
            <Input.TextArea
                rows={3}
                value={newComment}
                placeholder="Add a comment..."
                onChange={(e) => onCommentChange(e.target.value)}
            />
            <Button
                type="primary"
                onClick={onSubmitComment as React.MouseEventHandler}
                disabled={!newComment.trim()}
                className="submit-comment-btn"
            >
                Comment
            </Button>
        </div>
    </div>
);

// Main InteractionComponent
const InteractionComponent: React.FC<{ file: Item }> = ({ file }) => {
    const [totalLikes, setTotalLikes] = useState<number>(0);
    const [userLiked, setUserLiked] = useState<boolean>(false);
    const [comments, setComments] = useState<FileComment[]>(file.file_interactions?.comments || []);
    const [newComment, setNewComment] = useState<string>("");
    const [fileInteractionsSummary, setFileInteractionsSummary] =
        useState<FileInteractionsSummary>();
    const [loading, setLoading] = useState<boolean>(true);

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

    if (loading) {
        return (
            <div className="interaction-component">
                <Spin size="large" className="loading-spinner" />
            </div>
        );
    }

    return (
        <div className="interaction-component">
            {/* Likes Section */}
            <LikesSection
                totalLikes={totalLikes}
                userLiked={userLiked}
                onToggleLike={handleLikeToggle}
            />

            {/* Comments Section */}
            <CommentsSection
                comments={comments}
                newComment={newComment}
                onCommentChange={setNewComment}
                onSubmitComment={handleCommentSubmit}
            />
        </div>
    );
};

export default InteractionComponent;