import { memo } from "react";

type HeadingProps = {
  title: string;
  description?: string;
  className?: string;
};

function Heading({ title, description, className }: HeadingProps) {
  return (
    <div className={className}>
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export default memo(Heading);