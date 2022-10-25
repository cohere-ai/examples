import { useQuery } from '@tanstack/react-query';
import { DependencyList } from 'react';

import { Relationship } from '../pages/play/describe-relationship';

export const useCohereQuestion = (
  {
    relationship,
    setting,
    depth,
    model,
  }: { relationship: Relationship; setting: string; depth: number; model?: string },
  deps?: DependencyList,
) => {
  const { data, error, isLoading } = useQuery(
    ['question', relationship, setting, depth, model, ...(deps || [])],
    async () => {
      const response = await fetch('/api/generateQuestion', {
        method: 'POST',
        body: JSON.stringify({ relationship, setting, depth, model }),
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    { enabled: typeof relationship !== 'undefined' && typeof setting !== 'undefined' },
  );

  return { question: data?.question, isLoading, error };
};
