import React from "react";

/**
 * BaseCard Component
 * Encapsulates flat, bordered container rules:
 * - Solid white background (bg-white)
 * - Subtle border (border-slate-200)
 * - Soft, minimal shadow (shadow-sm)
 * - Responsive padding & adaptive mobile flex headers
 */
export default function BaseCard({
  children,
  className = "",
  title,
  subtitle,
  headerAction,
  footer,
  padding = "p-4 sm:p-6 lg:p-8",
  ...props
}) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl shadow-sm transition-shadow duration-200 ${padding} ${className}`}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="mb-6 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
          <div className="w-full flex-1 min-w-0">
            {title && (
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight leading-snug break-words">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-normal break-words">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && (
            <div className="shrink-0 self-start sm:self-auto mt-0.5 sm:mt-0">
              {headerAction}
            </div>
          )}
        </div>
      )}
      
      <div className="w-full">{children}</div>

      {footer && (
        <div className="mt-6 pt-4 border-t border-slate-100 text-xs sm:text-sm text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
}
