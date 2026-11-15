'use client';
// components/course/WishlistButton.tsx
import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistApi } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/authStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Props {
  courseId: number;
  initialState?: boolean;
}

export function WishlistButton({ courseId, initialState = false }: Props) {
  const [wishlisted, setWishlisted] = useState(initialState);
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  const toggle = useMutation({
    mutationFn: () => wishlisted ? wishlistApi.remove(courseId) : wishlistApi.add(courseId),
    onMutate: () => setWishlisted((w) => !w),
    onError: () => setWishlisted((w) => !w),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    },
  });

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) { router.push('/login'); return; }
        toggle.mutate();
      }}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
        wishlisted
          ? 'text-red-500 bg-red-50 dark:bg-red-950 hover:bg-red-100'
          : 'text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950'
      }`}
      title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
    </button>
  );
}
