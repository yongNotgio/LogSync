interface LoadingProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function Loading({ message = "Loading...", size = "md" }: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div
        className={`animate-spin rounded-full border-2 border-gray-200 border-t-primary-600 ${sizeClasses[size]}`}
      />
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}

export function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loading message={message} size="lg" />
    </div>
  );
}

export function LoadingInline() {
  return (
    <div className="inline-flex items-center gap-2">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
    </div>
  );
}
