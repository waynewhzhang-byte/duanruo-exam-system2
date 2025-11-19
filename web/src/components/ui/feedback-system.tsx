'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  Star, 
  Send, 
  CheckCircle,
  AlertTriangle,
  Heart,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useToast } from './use-toast';

export type FeedbackType = 'bug' | 'feature' | 'improvement' | 'complaint' | 'praise' | 'other';

export interface FeedbackData {
  type: FeedbackType;
  title: string;
  description: string;
  rating?: number;
  userAgent: string;
  currentUrl: string;
  userId?: string;
  email?: string;
  attachments?: File[];
}

interface FeedbackSystemProps {
  onSubmit?: (data: FeedbackData) => Promise<void>;
  className?: string;
}

export function FeedbackSystem({ onSubmit, className }: FeedbackSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [rating, setRating] = useState<number>(0);
  const { toast } = useToast();

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      
      const feedbackData: FeedbackData = {
        type: feedbackType,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        rating: rating || undefined,
        userAgent: navigator.userAgent,
        currentUrl: window.location.href,
        email: formData.get('email') as string || undefined,
      };

      if (onSubmit) {
        await onSubmit(feedbackData);
      } else {
        // 默认提交到API
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(feedbackData),
        });

        if (!response.ok) {
          throw new Error('提交失败');
        }
      }

      setIsSubmitted(true);
      toast({
        title: "反馈提交成功",
        description: "感谢您的反馈，我们会认真考虑您的建议。",
      });

      // 3秒后关闭对话框
      setTimeout(() => {
        setIsOpen(false);
        setIsSubmitted(false);
        setRating(0);
      }, 3000);
      
    } catch (error) {
      console.error('Submit feedback error:', error);
      toast({
        title: "提交失败",
        description: "请稍后重试或联系技术支持。",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [feedbackType, rating, onSubmit, toast]);

  const getFeedbackTypeIcon = (type: FeedbackType) => {
    switch (type) {
      case 'bug':
        return <Bug className="w-4 h-4" />;
      case 'feature':
        return <Lightbulb className="w-4 h-4" />;
      case 'improvement':
        return <Star className="w-4 h-4" />;
      case 'complaint':
        return <AlertTriangle className="w-4 h-4" />;
      case 'praise':
        return <Heart className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getFeedbackTypeLabel = (type: FeedbackType) => {
    switch (type) {
      case 'bug':
        return '错误报告';
      case 'feature':
        return '功能建议';
      case 'improvement':
        return '改进建议';
      case 'complaint':
        return '投诉建议';
      case 'praise':
        return '表扬建议';
      default:
        return '其他反馈';
    }
  };

  const getFeedbackTypeColor = (type: FeedbackType) => {
    switch (type) {
      case 'bug':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'feature':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'improvement':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'complaint':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'praise':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">反馈提交成功</h3>
            <p className="text-gray-600">
              感谢您的反馈，我们会认真处理您的建议。
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <MessageSquare className="w-4 h-4 mr-2" />
          反馈建议
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            用户反馈
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 反馈类型选择 */}
          <div className="space-y-3">
            <Label>反馈类型</Label>
            <div className="grid grid-cols-2 gap-3">
              {(['bug', 'feature', 'improvement', 'complaint', 'praise', 'other'] as FeedbackType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFeedbackType(type)}
                  className={`
                    p-3 rounded-lg border-2 transition-all duration-200 text-left
                    ${feedbackType === type 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getFeedbackTypeIcon(type)}
                    <span className="font-medium text-sm">
                      {getFeedbackTypeLabel(type)}
                    </span>
                  </div>
                  <Badge className={`text-xs ${getFeedbackTypeColor(type)}`}>
                    {type}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* 评分（仅限praise和complaint类型） */}
          {(feedbackType === 'praise' || feedbackType === 'complaint') && (
            <div className="space-y-3">
              <Label>评分</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`
                      p-1 rounded transition-colors
                      ${star <= rating 
                        ? 'text-yellow-500' 
                        : 'text-gray-300 hover:text-yellow-400'
                      }
                    `}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {rating > 0 ? `${rating} 星` : '请评分'}
                </span>
              </div>
            </div>
          )}

          {/* 标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">标题 *</Label>
            <Input
              id="title"
              name="title"
              placeholder="请简要描述您的反馈"
              required
              maxLength={100}
            />
          </div>

          {/* 详细描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">详细描述 *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="请详细描述您遇到的问题或建议..."
              required
              rows={5}
              maxLength={1000}
            />
            <div className="text-xs text-gray-500">
              {feedbackType === 'bug' && "请描述具体的操作步骤和错误现象"}
              {feedbackType === 'feature' && "请说明您希望添加的功能和使用场景"}
              {feedbackType === 'improvement' && "请说明现有功能的不足之处和改进建议"}
              {feedbackType === 'complaint' && "请说明具体的问题和您的建议"}
              {feedbackType === 'praise' && "请告诉我们您喜欢的功能或服务"}
              {feedbackType === 'other' && "请详细说明您的反馈内容"}
            </div>
          </div>

          {/* 联系邮箱 */}
          <div className="space-y-2">
            <Label htmlFor="email">联系邮箱（可选）</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="如需回复请留下邮箱"
            />
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  提交中...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  提交反馈
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// 快速反馈按钮组件
export function QuickFeedback({ className }: { className?: string }) {
  const { toast } = useToast();

  const handleQuickFeedback = async (type: 'like' | 'dislike') => {
    try {
      const response = await fetch('/api/feedback/quick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast({
          title: type === 'like' ? "感谢您的好评" : "感谢您的反馈",
          description: type === 'like' ? "您的支持是我们前进的动力" : "我们会努力改进",
        });
      }
    } catch (error) {
      console.error('Quick feedback error:', error);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-600">这个页面有用吗？</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleQuickFeedback('like')}
        className="text-green-600 hover:text-green-700 hover:bg-green-50"
      >
        <ThumbsUp className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleQuickFeedback('dislike')}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <ThumbsDown className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default FeedbackSystem;