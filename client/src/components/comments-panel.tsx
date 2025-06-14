import { useState } from "react";
import { Comment } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface CommentsPanelProps {
  comments: Comment[];
}

export default function CommentsPanel({ comments }: CommentsPanelProps) {
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();

  const addCommentMutation = useMutation({
    mutationFn: (comment: { author: string; content: string }) =>
      apiRequest('POST', '/api/comments', comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comments'] });
      setNewComment("");
    },
  });

  const likeCommentMutation = useMutation({
    mutationFn: (id: number) => apiRequest('POST', `/api/comments/${id}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comments'] });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    addCommentMutation.mutate({
      author: "Anonymous Listener",
      content: newComment,
    });
  };

  const handleLikeComment = (id: number) => {
    likeCommentMutation.mutate(id);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold">Listener Comments</h3>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No comments yet</p>
            <p className="text-sm mt-1">Be the first to leave a comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border border-border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{comment.author}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(comment.timestamp), 'MMM d, HH:mm')}
                </span>
              </div>
              <p className="text-sm text-foreground">{comment.content}</p>
              <div className="flex items-center space-x-3 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-xs text-muted-foreground hover:text-primary"
                  onClick={() => handleLikeComment(comment.id)}
                  disabled={likeCommentMutation.isPending}
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  {comment.likes || 0}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-xs text-muted-foreground hover:text-primary"
                >
                  Reply
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmitComment} className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Leave a comment..."
            className="resize-none bg-muted border-border focus:border-primary"
            rows={3}
          />
          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={addCommentMutation.isPending}
          >
            {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
          </Button>
        </form>
      </div>
    </div>
  );
}
