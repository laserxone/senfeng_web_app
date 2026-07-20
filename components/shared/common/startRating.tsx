import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { useState } from "react";



const StarRating = ({ value = 0, onChange, size=24 }: { value?: number, onChange?: (val: number) => void, size ?: number }) => {
  const [rating, setRating] = useState(value);

  const handleRating = (newRating: number) => {
    setRating(newRating);
    onChange?.(newRating);
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((num) => (
        <Star
          key={num}
          size={size}
          className={cn(
            "cursor-pointer transition-all",
            num <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-400"
          )}
          onClick={() => handleRating(num)}
        />
      ))}
    </div>
  );
};

export default StarRating