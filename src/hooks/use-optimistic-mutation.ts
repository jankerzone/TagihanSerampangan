import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showError } from '@/utils/toast';

interface UseOptimisticMutationOptions<TItem, TUpdates> {
  queryKey: string[];
  listKey: string;
  mutationFn: (params: { id: string; updates: TUpdates }) => Promise<any>;
  errorMessage?: string;
}

/**
 * A generic hook for optimistic updates on list items.
 * Handles cancel, snapshot, optimistic update, rollback on error, and invalidation.
 */
export function useOptimisticMutation<TItem extends { id: string }, TUpdates>({
  queryKey,
  listKey,
  mutationFn,
  errorMessage = 'Failed to update item',
}: UseOptimisticMutationOptions<TItem, TUpdates>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically update
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old || !old[listKey]) return old;
        return {
          ...old,
          [listKey]: old[listKey].map((item: TItem) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        };
      });

      return { previousData };
    },
    onError: (_err, _variables, context: any) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      showError(errorMessage);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
