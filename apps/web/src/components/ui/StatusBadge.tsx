const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "badge-neutral" },
  uploaded: { label: "Uploaded", className: "badge-info" },
  processing: { label: "Processing", className: "badge-warning" },
  processing_failed: { label: "Failed", className: "badge-danger" },
  pending_review: { label: "Pending Review", className: "badge-warning" },
  approved: { label: "Approved", className: "badge-success" },
  rejected: { label: "Rejected", className: "badge-danger" },
  needs_changes: { label: "Needs Changes", className: "badge-warning" },
  published: { label: "Published", className: "badge-success" },
  hidden: { label: "Hidden", className: "badge-neutral" },
  removed: { label: "Removed", className: "badge-danger" },
  reported: { label: "Reported", className: "badge-danger" },
  active: { label: "Active", className: "badge-success" },
  inactive: { label: "Inactive", className: "badge-neutral" },
  banned: { label: "Banned", className: "badge-danger" },
  suspended: { label: "Suspended", className: "badge-warning" },
  open: { label: "Open", className: "badge-success" },
  closed: { label: "Closed", className: "badge-neutral" },
  resolved: { label: "Resolved", className: "badge-info" },
  pending: { label: "Pending", className: "badge-warning" },
  reviewed: { label: "Reviewed", className: "badge-success" },
  dismissed: { label: "Dismissed", className: "badge-neutral" },
  escalated: { label: "Escalated", className: "badge-danger" },
};

export default function StatusBadge({
  status,
  className = "",
}: {
  status: string;
  className?: string;
}) {
  const config = statusConfig[status] || { label: status, className: "badge-neutral" };
  return (
    <span className={`badge ${config.className} ${className}`}>
      {config.label}
    </span>
  );
}
