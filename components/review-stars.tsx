import { Star } from 'lucide-react'

interface ReviewStarsProps {
  rating: number
  count?: number
  size?: 'sm' | 'md'
}

export function ReviewStars({ rating, count, size = 'sm' }: ReviewStarsProps) {
  const starSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starSize} ${
            star <= Math.round(rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
      {count !== undefined && (
        <span className="ml-1 text-xs text-muted-foreground">
          {rating.toFixed(1)} ({count})
        </span>
      )}
    </div>
  )
}