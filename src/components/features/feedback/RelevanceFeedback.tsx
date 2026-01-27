'use client';

import { SpamBResult } from '@/lib/ai/spamB';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface RelevanceFeedbackProps {
  relevance: SpamBResult | null | undefined;
  className?: string;
}

export function RelevanceFeedback({ relevance, className }: RelevanceFeedbackProps) {
  // Don't show anything if no relevance data or if on-topic
  if (!relevance || relevance.interpretation === 'on_topic') {
    return null;
  }

  const isOffTopic = relevance.interpretation === 'off_topic';
  const isPartiallyRelevant = relevance.interpretation === 'partially_relevant';

  const getIcon = () => {
    if (isOffTopic) return <AlertCircle className="h-5 w-5 text-red-500" />;
    if (isPartiallyRelevant) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <Info className="h-5 w-5 text-blue-500" />;
  };

  const getBorderColor = () => {
    if (isOffTopic) return 'border-red-500';
    if (isPartiallyRelevant) return 'border-yellow-500';
    return 'border-blue-500';
  };

  const getBadgeVariant = () => {
    if (isOffTopic) return 'destructive';
    return 'secondary';
  };

  return (
    <Card className={`${getBorderColor()} ${className}`}>
      <div className="flex items-start gap-3 px-6">
        {getIcon()}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">
              {isOffTopic ? 'Răspuns în afara subiectului' : 'Răspuns parțial relevant'}
            </h4>
            <Badge variant={getBadgeVariant()}>
              {Math.round(relevance.relevance_score * 100)}% relevant
            </Badge>
          </div>

          {relevance.topic_analysis.suggested_redirect && (
            <p className="text-sm text-muted-foreground">
              {relevance.topic_analysis.suggested_redirect}
            </p>
          )}

          {relevance.topic_analysis.user_topics.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              <span className="font-medium">Ai vorbit despre:</span>{' '}
              {relevance.topic_analysis.user_topics.join(', ')}
            </div>
          )}

          {relevance.topic_analysis.content_topics.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Subiectul lecției:</span>{' '}
              {relevance.topic_analysis.content_topics.join(', ')}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
