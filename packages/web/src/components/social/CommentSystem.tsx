'use client';

import { useState, useEffect } from 'react';
import { 
  PaperAirplaneIcon,
  HeartIcon,
  TrashIcon,
  FlagIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { PostComment, AddCommentRequest } from '@vangarments/shared';
import { socialApi } from '../../lib/socialApi';
import { useAuth } from '../../hooks/useAuth';

interface CommentSystemProps {
  postId: string;
  initialComments?: PostComment[];
  onCommentAdded?: (comment: PostComment) => void;
  onCommentDeleted?: (commentId: string) => void;
}

export function CommentSystem({
  postId,
  initialComments = [],
  onCommentAdded,
  onCommentDeleted
}: CommentSystemProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<PostComment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [showActions, setShowActions] = useState<string | null>(null);

  useEffect(() => {
    if (initialComments.length === 0) {
      loadComments();
    }
  }, [postId]);

  const loadComments = async () => {
    try {
      // This would be a separate API endpoint for getting post comments
      // For now, we'll use the existing comments
      setComments(initialComments);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim() || loading) return;

    setLoading(true);
    try {
      const commentData: AddCommentRequest = {
        content: newComment.trim()
      };

      const comment = await socialApi.addComment(postId, commentData);
      
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      onCommentAdded?.(comment);
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReply = async (parentCommentId: string) => {
    if (!user || !replyText.trim() || loading) return;

    setLoading(true);
    try {
      const commentData: AddCommentRequest = {
        content: replyText.trim(),
        parentCommentId
      };

      const reply = await socialApi.addComment(postId, commentData);
      
      // Add reply to the parent comment
      setComments(prev => prev.map(comment => {
        if (comment.id === parentCommentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), reply]
          };
        }
        return comment;
      }));

      setReplyText('');
      setReplyingTo(null);
      onCommentAdded?.(reply);
    } catch (err) {
      console.error('Failed to add reply:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user || loading) return;

    setLoading(true);
    try {
      await socialApi.deleteComment(commentId);
      
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      onCommentDeleted?.(commentId);
    } catch (err) {
      console.error('Failed to delete comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) return;

    try {
      const isLiked = likedComments.has(commentId);
      
      if (isLiked) {
        // Unlike comment (would need API endpoint)
        setLikedComments(prev => {
          const newSet = new Set(prev);
          newSet.delete(commentId);
          return newSet;
        });
      } else {
        // Like comment (would need API endpoint)
        setLikedComments(prev => new Set(prev).add(commentId));
      }
    } catch (err) {
      console.error('Failed to toggle comment like:', err);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    
    return date.toLocaleDateString('pt-BR');
  };

  const CommentItem = ({ comment, isReply = false }: { comment: PostComment; isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-8 mt-2' : 'mt-4'}`}>
      <div className="flex space-x-3">
        <img
          src={comment.user?.profile.profilePicture || '/api/placeholder/32/32'}
          alt={comment.user?.profile.name}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
        
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-sm text-gray-900">
                {comment.user?.profile.name}
              </span>
              <span className="text-xs text-gray-500">
                {formatTimeAgo(comment.createdAt)}
              </span>
            </div>
            
            <p className="text-sm text-gray-700">
              {comment.content}
            </p>
          </div>
          
          <div className="flex items-center space-x-4 mt-1 ml-3">
            <button
              onClick={() => handleLikeComment(comment.id)}
              className="flex items-center space-x-1 text-xs text-gray-500 hover:text-pink-500 transition-colors"
            >
              {likedComments.has(comment.id) ? (
                <HeartSolidIcon className="w-3 h-3 text-pink-500" />
              ) : (
                <HeartIcon className="w-3 h-3" />
              )}
              <span>Curtir</span>
            </button>
            
            {!isReply && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                Responder
              </button>
            )}
            
            {user && comment.userId === user.id && (
              <div className="relative">
                <button
                  onClick={() => setShowActions(showActions === comment.id ? null : comment.id)}
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <EllipsisHorizontalIcon className="w-3 h-3" />
                </button>
                
                {showActions === comment.id && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[100px]">
                    <button
                      onClick={() => {
                        handleDeleteComment(comment.id);
                        setShowActions(null);
                      }}
                      className="flex items-center space-x-2 w-full px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      <TrashIcon className="h-3 w-3" />
                      <span>Excluir</span>
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {user && comment.userId !== user.id && (
              <button className="text-xs text-gray-500 hover:text-red-500 transition-colors">
                <FlagIcon className="w-3 h-3" />
              </button>
            )}
          </div>
          
          {/* Reply Input */}
          {replyingTo === comment.id && (
            <div className="mt-2 ml-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Responder para ${comment.user?.profile.name}...`}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  maxLength={500}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddReply(comment.id);
                    }
                  }}
                />
                <button
                  onClick={() => handleAddReply(comment.id)}
                  disabled={!replyText.trim() || loading}
                  className="px-3 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Add Comment */}
      {user && (
        <div className="flex space-x-3">
          <img
            src={'/api/placeholder/40/40'}
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
          
          <div className="flex-1">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Adicione um comentário..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                maxLength={500}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || loading}
                className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-1">
              {newComment.length}/500 caracteres
            </p>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-1">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum comentário ainda.</p>
            {user && (
              <p className="text-sm text-gray-400 mt-1">
                Seja o primeiro a comentar!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500"></div>
            <span className="text-sm">Processando...</span>
          </div>
        </div>
      )}
    </div>
  );
}