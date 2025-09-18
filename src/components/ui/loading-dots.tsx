import React from "react";
import { cn } from "@/lib/utils";

interface LoadingDotsProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "muted" | "success" | "warning" | "error";
}

const sizeClasses = {
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
  lg: "w-3 h-3",
};

const colorClasses = {
  primary: "bg-primary",
  muted: "bg-muted-foreground",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
};

export function LoadingDots({
  className,
  size = "md",
  color = "primary",
}: LoadingDotsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div
        className={cn(
          "rounded-full animate-bounce",
          sizeClasses[size],
          colorClasses[color]
        )}
        style={{
          animationDelay: "0ms",
          animationDuration: "1.2s",
        }}
      />
      <div
        className={cn(
          "rounded-full animate-bounce",
          sizeClasses[size],
          colorClasses[color]
        )}
        style={{
          animationDelay: "200ms",
          animationDuration: "1.2s",
        }}
      />
      <div
        className={cn(
          "rounded-full animate-bounce",
          sizeClasses[size],
          colorClasses[color]
        )}
        style={{
          animationDelay: "400ms",
          animationDuration: "1.2s",
        }}
      />
    </div>
  );
}

interface AnimatedLoadingMessageProps {
  message: string;
  className?: string;
  showDots?: boolean;
  dotSize?: "sm" | "md" | "lg";
  dotColor?: "primary" | "muted" | "success" | "warning" | "error";
}

export function AnimatedLoadingMessage({
  message,
  className,
  showDots = true,
  dotSize = "sm",
  dotColor = "muted",
}: AnimatedLoadingMessageProps) {
  return (
    <div className={cn("flex items-center gap-2 text-sm font-mono", className)}>
      <span className="text-muted-foreground">{message}</span>
      {showDots && <LoadingDots size={dotSize} color={dotColor} />}
    </div>
  );
}
