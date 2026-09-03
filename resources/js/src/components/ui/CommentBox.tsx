import React, { useState, useRef, useEffect } from 'react';
import { User, CommentType } from '@/src/types'; // Updated to CommentType below
import { router as Inertia } from '@inertiajs/react';

interface CommentBoxProps {
    submitUrl: string;
    users: User[];
    comments: CommentType[]; // We'll update types.ts to have CommentType
    isLocked?: boolean;
    title?: string;
}

// Helper to render text with @mentions highlighted in blue
const formatCommentWithMentions = (text: string) => {
    const parts = text.split(/(?<=\s|^)(@\w+)/g);
    return parts.map((part, index) => {
        if (part.startsWith('@')) {
            return (
                <span key={index} className="text-blue-600 font-semibold cursor-pointer hover:underline">
                    {part}
                </span>
            );
        }
        return <span key={index}>{part}</span>;
    });
};

const CommentBox: React.FC<CommentBoxProps> = ({ submitUrl, users, comments, isLocked = false, title = "Messages" }) => {
    const [newComment, setNewComment] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [mentionSearch, setMentionSearch] = useState<string | null>(null);
    const [mentionIndex, setMentionIndex] = useState<number | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [comments]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setNewComment(val);

        const cursorPosition = e.target.selectionStart;
        const textBeforeCursor = val.slice(0, cursorPosition);
        const match = textBeforeCursor.match(/(?:^|\s)@([^\s]*)$/);

        if (match) {
            setMentionSearch(match[1].toLowerCase());
            const atIndex = textBeforeCursor.lastIndexOf('@');
            setMentionIndex(atIndex);
        } else {
            setMentionSearch(null);
            setMentionIndex(null);
        }
    };

    const handleUserSelect = (userName: string) => {
        if (mentionIndex !== null && mentionSearch !== null) {
            const beforeMention = newComment.slice(0, mentionIndex);
            const afterMention = newComment.slice(mentionIndex + mentionSearch.length + 1);

            const newValue = `${beforeMention}@${userName} ${afterMention}`;
            setNewComment(newValue);
            setMentionSearch(null);
            setMentionIndex(null);

            if (textareaRef.current) {
                textareaRef.current.focus();
            }
        }
    };

    const filteredUsers = mentionSearch !== null
        ? users.filter(u => u.name.toLowerCase().includes(mentionSearch)).slice(0, 5)
        : [];

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        Inertia.post(
            submitUrl,
            { comment: newComment, is_private: isPrivate },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setNewComment('');
                    setIsPrivate(false);
                },
            }
        );
    };

    return (
        <div className="bg-white border rounded-lg shadow-sm flex flex-col h-[500px]">
            <div className="p-4 border-b bg-gray-50 font-bold text-gray-700 flex justify-between items-center">
                <span>{title}</span>
                <span className="text-xs font-normal text-gray-500">{comments.length} messages</span>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {comments && comments.length > 0 ? (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex flex-col">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-bold text-blue-600">
                                    {comment.user?.name || 'System'}
                                    {comment.is_private && <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase">Private</span>}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {new Date(comment.created_at).toLocaleString()}
                                </span>
                            </div>
                            <div className={`p-3 rounded-lg border shadow-sm text-sm whitespace-pre-wrap ${comment.is_private ? 'bg-red-50 border-red-100 text-gray-800' : 'bg-white text-gray-800'}`}>
                                {formatCommentWithMentions(comment.comment)}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-400 mt-10">No messages yet.</div>
                )}
            </div>

            <div className="p-4 border-t relative bg-white rounded-b-lg">
                <form onSubmit={handleAddComment} className="flex flex-col space-y-3">
                    <textarea
                        ref={textareaRef}
                        className="w-full border rounded-lg p-3 text-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50 resize-none"
                        placeholder="Type a message (use @name to mention)..."
                        rows={3}
                        value={newComment}
                        onChange={handleTextChange}
                        disabled={isLocked}
                    />

                    {mentionSearch !== null && filteredUsers.length > 0 && (
                        <div className="absolute bottom-full left-4 mb-2 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                            {filteredUsers.map(user => (
                                <div
                                    key={user.id}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm font-medium text-gray-700"
                                    onClick={() => handleUserSelect(user.name)}
                                >
                                    {user.name}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="rounded text-blue-600 focus:ring-blue-500"
                                checked={isPrivate}
                                onChange={(e) => setIsPrivate(e.target.checked)}
                                disabled={isLocked}
                            />
                            <span className="text-sm text-gray-600 font-medium">Only for me</span>
                        </label>

                        <button
                            type="submit"
                            disabled={isLocked || !newComment.trim()}
                            className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:bg-gray-400 transition-colors shadow-sm"
                        >
                            Send Message
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CommentBox;
