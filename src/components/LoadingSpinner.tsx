interface LoadingSpinnerProps {
  /** Text shown below the spinner */
  text?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Full-screen mode */
  fullscreen?: boolean;
}

const sizeMap = {
  sm: { spinner: "w-5 h-5 border-2", text: "text-[10px]" },
  md: { spinner: "w-8 h-8 border-2", text: "text-xs" },
  lg: { spinner: "w-12 h-12 border-[3px]", text: "text-sm" },
};

/**
 * Reusable loading spinner following the PharmPaper design system.
 *
 * Usage:
 *   <LoadingSpinner />
 *   <LoadingSpinner text="Loading Dashboard..." fullscreen />
 *   <LoadingSpinner size="sm" />
 */
export default function LoadingSpinner({
  text,
  size = "md",
  fullscreen = false,
}: LoadingSpinnerProps) {
  const { spinner, text: textClass } = sizeMap[size];

  const content = (
    <div
      className="flex flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
      aria-label={text ?? "Loading"}
    >
      <div
        className={`${spinner} rounded-full border-brand-border border-t-brand animate-spin`}
      />
      {text && (
        <span
          className={`${textClass} font-mono uppercase tracking-widest text-brand-cream/50`}
        >
          {text}
        </span>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="min-h-screen bg-brand-charcoal flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}
