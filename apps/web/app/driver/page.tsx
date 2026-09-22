"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { DriverPool, RideStatus } from "@/lib/types";

function money(value: number) { return `৳${(value / 100).toFixed(2)}`; }
function pretty(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()); }

const ACTIONS: Partial<Record<RideStatus, { action: "ACCEPT" | "ARRIVE" | "START" | "COMPLETE"; label: string }>> = {
  REQUESTED: { action: "ACCEPT", label: "Accept pool" },
  MATCHED: { action: "ARRIVE", label: "Mark arrived" },
  DRIVER_ARRIVED: { action: "START", label: "Start trip" },
  STARTED: { action: "COMPLETE", label: "Complete trip" },
};

export default function DriverPage() {
  const router = useRouter();
  const session = typeof window === "undefined" ? null : getSession();
  const [vehicle, setVehicle] = useState<{ id: string; name: string; capacity: number; isOnline: boolean } | null>(null);
  const [pools, setPools] = useState<DriverPool[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [vehicleResponse, poolResponse] = await Promise.all([
      apiFetch<{ vehicle: { id: string; name: string; capacity: number; isOnline: boolean } }>("/driver/vehicle"),
      apiFetch<{ pools: DriverPool[] }>("/driver/pools"),
    ]);
    setVehicle(vehicleResponse.vehicle);
    setPools(poolResponse.pools);
  }, []);

  useEffect(() => {
    if (!session || session.user.role !== "DRIVER") { router.replace("/login"); return; }
    void load().catch((err) => setMessage(err.message));
    const timer = window.setInterval(() => void load().catch(() => undefined), 3000);
    return () => window.clearInterval(timer);
  }, [load, router]);

  const activePools = useMemo(() => pools.filter((pool) => !["COMPLETED", "CANCELLED"].includes(pool.status)), [pools]);
  const history = useMemo(() => pools.filter((pool) => ["COMPLETED", "CANCELLED"].includes(pool.status)), [pools]);

  async function toggleOnline() {
    if (!vehicle) return;
    setBusy(true); setMessage("");
    try {
      await apiFetch("/driver/vehicle/online", { method: "PATCH", body: JSON.stringify({ isOnline: !vehicle.isOnline }) });
      await load();
    } catch (err) { setMessage(err instanceof Error ? err.message : "Unable to change availability"); }
    finally { setBusy(false); }
  }

  async function transition(poolId: string, action: string) {
    setBusy(true); setMessage("");
    try {
      await apiFetch(`/driver/pools/${poolId}/transition`, { method: "POST", body: JSON.stringify({ action }) });
      await load();
    } catch (err) { setMessage(err instanceof Error ? err.message : "Transition failed"); }
    finally { setBusy(false); }
  }

  if (!session) return null;

  return (
    <main className="dashboard-shell">
      <AppHeader name={session.user.name} role="Driver" />
      <section className="driver-hero panel">
        <div><span className="eyebrow">Driver / Tesla</span><h1>{vehicle?.name ?? "Bullet"}</h1><p>Three seats. One active trip. Candidate pools can wait in the queue.</p></div>
        <div className="driver-control"><span className={`online-dot ${vehicle?.isOnline ? "on" : ""}`}></span><strong>{vehicle?.isOnline ? "Online" : "Offline"}</strong><button className="button button-secondary" disabled={busy} onClick={() => void toggleOnline()}>{vehicle?.isOnline ? "Go offline" : "Go online"}</button></div>
      </section>
      {message && <p className="notice">{message}</p>}

      <section className="history-section">
        <div className="section-heading"><div><span className="eyebrow">Dispatch queue</span><h2>Active & candidate pools</h2></div><button className="button button-ghost button-small" onClick={() => void load()}>Refresh</button></div>
        <div className="pool-grid">{activePools.length === 0 ? <div className="panel empty"><strong>No candidate pools</strong><span>Sign in as Nusrat or Rafiq and request a ride.</span></div> : activePools.map((pool) => {
          const action = ACTIONS[pool.status];
          return <article className="panel pool-card" key={pool.id}>
            <div className="card-row"><StatusBadge status={pool.status} /><span className="muted">{pool.reservedSeats}/{pool.capacity} seats</span></div>
            <h3>{pretty(pool.pickupZone)} pool</h3>
            <div className="seat-bar"><span style={{ width: `${(pool.reservedSeats / pool.capacity) * 100}%` }}></span></div>
            <div className="member-list">{pool.members.map((member) => <div className="member" key={member.rideId}><div><strong>{member.passenger.name}</strong><span>{pretty(member.pickupZone)} → {pretty(member.destinationZone)}</span></div><div><strong>{money(member.farePoysha)}</strong><span>{member.seats} seat{member.seats > 1 ? "s" : ""}</span></div></div>)}</div>
            {action && <button className="button button-primary button-block" disabled={busy} onClick={() => void transition(pool.id, action.action)}>{action.label}</button>}
          </article>;
        })}</div>
      </section>

      <section className="history-section">
        <div className="section-heading"><div><span className="eyebrow">Driver history</span><h2>Finished pools</h2></div></div>
        <div className="history-grid">{history.length === 0 ? <div className="panel empty"><span>Completed pools appear here.</span></div> : history.map((pool) => <article className="panel history-card" key={pool.id}><StatusBadge status={pool.status} /><h3>{pretty(pool.pickupZone)} · {pool.members.length} passenger{pool.members.length === 1 ? "" : "s"}</h3><p>{new Date(pool.createdAt).toLocaleString()}</p></article>)}</div>
      </section>
    </main>
  );
}
