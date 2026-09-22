import type { RideStatus } from "@/lib/types";

const LABELS: Record<RideStatus, string> = {
  REQUESTED: "Waiting",
  MATCHED: "Matched",
  DRIVER_ARRIVED: "Driver arrived",
  STARTED: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function StatusBadge({ status }: { status: RideStatus }) {
  return <span className={`status status-${status.toLowerCase()}`}>{LABELS[status]}</span>;
}
