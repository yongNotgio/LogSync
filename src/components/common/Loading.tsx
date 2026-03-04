interface LoadingProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function Loading({ message = "Loading...", size = "md" }: LoadingProps) {
  const sizeClasses = {
    sm: "h-5 w-5 border-2",
    md: "h-9 w-9 border-[3px]",
    lg: "h-14 w-14 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="relative">
        {/* Outer ring */}
        <div className={`${sizeClasses[size]} rounded-full border-sky-100`} />
        {/* Spinning ring */}
        <div
          className={`absolute inset-0 rounded-full animate-spin ${sizeClasses[size]} border-transparent border-t-sky-500`}
          style={{ borderStyle: "solid" }}
        />
        {/* Inner glow */}
        <div className="absolute inset-[20%] rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 opacity-20 animate-pulse" />
      </div>
      {message && (
        <p className="text-sm font-medium text-sky-600 animate-pulse tracking-wide">{message}</p>
      )}
    </div>
  );
}

export function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-gradient-to-br from-sky-50/60 via-white to-indigo-50/60 rounded-2xl">
      <div className="text-center">
        <Loading message={message} size="lg" />
      </div>
    </div>
  );
}

export function LoadingInline() {
  return (
    <div className="inline-flex items-center gap-2">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-100 border-t-sky-500" />
    </div>
  );
}

