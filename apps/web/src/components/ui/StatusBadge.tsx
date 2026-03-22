const statusConfig: Record<string, { label: string; className: string; icon: string }> = {
  // Content state machine (12 states)
  draft:             { label: "Draft",           className: "badge-neutral",  icon: "✏️" },
  uploaded:          { label: "Uploaded",        className: "badge-info",     icon: "📤" },
  processing:        { label: "Processing",      className: "badge-warning",  icon: "⏳" },
  processing_failed: { label: "Failed",          className: "badge-danger",   icon: "❌" },
  pending_review:    { label: "Pending Review",  className: "badge-warning",  icon: "👁️" },
  approved:          { label: "Approved",        className: "badge-success",  icon: "✅" },
  rejected:          { label: "Rejected",        className: "badge-danger",   icon: "🚫" },
  needs_changes:     { label: "Needs Changes",   className: "badge-warning",  icon: "🔄" },
  published:         { label: "Published",       className: "badge-success",  icon: "🌐" },
  hidden:            { label: "Hidden",          className: "badge-neutral",  icon: "👻" },
  removed:           { label: "Removed",         className: "badge-danger",   icon: "🗑️" },
  reported:          { label: "Reported",        className: "badge-danger",   icon: "⚠️" },

  // User statuses
  active:    { label: "Active",    className: "badge-success",  icon: "🟢" },
  inactive:  { label: "Inactive",  className: "badge-neutral",  icon: "⚪" },
  banned:    { label: "Banned",    className: "badge-danger",   icon: "🔒" },
  suspended: { label: "Suspended", className: "badge-warning",  icon: "⏸️" },

  // Report statuses
  open:      { label: "Open",      className: "badge-success",  icon: "📂" },
  closed:    { label: "Closed",    className: "badge-neutral",  icon: "📁" },
  resolved:  { label: "Resolved",  className: "badge-info",     icon: "✔️" },
  pending:   { label: "Pending",   className: "badge-warning",  icon: "⏱️" },
  reviewed:  { label: "Reviewed",  className: "badge-success",  icon: "📋" },
  dismissed: { label: "Dismissed", className: "badge-neutral",  icon: "💨" },
  escalated: { label: "Escalated", className: "badge-danger",   icon: "🔺" },

  // Legacy compat for old "processed" status
  processed: { label: "Processed", className: "badge-info",     icon: "⚙️" },
};

export default function StatusBadge({
  status,
  className = "",
  showIcon = false,
}: {
  status: string;
  className?: string;
  showIcon?: boolean;
}) {
  const config = statusConfig[status] || { label: status, className: "badge-neutral", icon: "•" };
  return (
    <span className={`badge ${config.className} ${className}`}>
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </span>
  );
}
