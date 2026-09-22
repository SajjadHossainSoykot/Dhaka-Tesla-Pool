"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/session";
import type { PassengerRide, Session, Zone } from "@/lib/types";

const ACTIVE = new Set(["REQUESTED", "MATCHED", "DRIVER_ARRIVED", "STARTED"]);
const CANCELLABLE = new Set(["REQUESTED", "MATCHED", "DRIVER_ARRIVED"]);

function money(value: number) { return `৳${(value / 100).toFixed(2)}`; }
function prettyZone(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()); }

export default function PassengerPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [rides, setRides] = useState<PassengerRide[]>([]);
  const [pickupZone, setPickupZone] = useState("BANANI");
  const [destinationZone, setDestinationZone] = useState("MOHAKHALI");
  const [seats, setSeats] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TESLAPAY">("CASH");
  const [estimate, setEstimate] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [zoneResponse, rideResponse] = await Promise.all([
      apiFetch<{ zones: Zone[] }>("/meta/zones"),
      apiFetch<{ rides: PassengerRide[] }>("/rides/mine"),
    ]);
    setZones(zoneResponse.zones);
    setRides(rideResponse.rides);
  }, []);

  useEffect(() => {
    const current = getSession();
    if (!current || current.user.role !== "PASSENGER") {
      router.replace("/login");
      return;
    }
    setSession(current);
    void load().catch((err) => setMessage(err.message));
    const timer = window.setInterval(() => void load().catch(() => undefined), 3500);
    return () => window.clearInterval(timer);
  }, [load, router]);

  useEffect(() => {
    if (pickupZone === destinationZone) { setEstimate(null); return; }
    void apiFetch<{ fare: { totalPoysha: number } }>(
      `/meta/fare-estimate?pickupZone=${pickupZone}&destinationZone=${destinationZone}&seats=${seats}&pooled=false`,
    ).then((data) => setEstimate(data.fare.totalPoysha)).catch(() => setEstimate(null));
  }, [pickupZone, destinationZone, seats]);

  const activeRide = useMemo(() => rides.find((ride) => ACTIVE.has(ride.status)), [rides]);
  const history = useMemo(() => rides.filter((ride) => !ACTIVE.has(ride.status)), [rides]);

  async function requestRide(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setMessage("");
    try {
      await apiFetch("/rides", { method: "POST", body: JSON.stringify({ pickupZone, destinationZone, seats, paymentMethod }) });
      setMessage("Ride requested. Bullet is checking compatible seats.");
      await load();
    } catch (err) { setMessage(err instanceof Error ? err.message : "Ride request failed"); }
    finally { setBusy(false); }
  }

  async function cancelRide(id: string) {
    setBusy(true); setMessage("");
    try { await apiFetch(`/rides/${id}/cancel`, { method: "POST" }); await load(); }
    catch (err) { setMessage(err instanceof Error ? err.message : "Cancellation failed"); }
    finally { setBusy(false); }
  }

  if (!session) return null;

  return (
    <main className="dashboard-shell">
      <AppHeader name={session.user.name} role="Passenger" />
      <section className="dashboard-grid">
        <div className="column">
          <div className="section-heading"><div><span className="eyebrow">Passenger flow</span><h1>Where are you going?</h1></div></div>
          <form className="panel ride-form" onSubmit={requestRide}>
            <div className="form-grid two">
              <label>Pickup<select value={pickupZone} onChange={(e) => setPickupZone(e.target.value)}>{zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.label}</option>)}</select></label>
              <label>Destination<select value={destinationZone} onChange={(e) => setDestinationZone(e.target.value)}>{zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.label}</option>)}</select></label>
              <label>Seats<select value={seats} onChange={(e) => setSeats(Number(e.target.value))}><option value={1}>1 seat</option><option value={2}>2 seats</option><option value={3}>3 seats</option></select></label>
              <label>Payment<select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as "CASH" | "TESLAPAY")}><option value="CASH">Cash</option><option value="TESLAPAY">TeslaPay (simulated)</option></select></label>
            </div>
            <div className="fare-preview"><span>Solo estimate</span><strong>{estimate === null ? "—" : money(estimate)}</strong><small>Pooling applies a 20% discount when another compatible passenger joins.</small></div>
            <button className="button button-primary button-block" disabled={busy || Boolean(activeRide) || pickupZone === destinationZone}>{activeRide ? "Finish current ride first" : busy ? "Requesting…" : "Request ride"}</button>
          </form>
          {message && <p className="notice">{message}</p>}
        </div>

        <div className="column">
          <div className="section-heading"><div><span className="eyebrow">Live state</span><h2>Active ride</h2></div><button className="button button-ghost button-small" onClick={() => void load()}>Refresh</button></div>
          {!activeRide ? <div className="panel empty"><strong>No active ride</strong><span>Request one from the form and use Jashim’s dashboard to move it through the lifecycle.</span></div> : (
            <article className="panel ride-card">
              <div className="card-row"><StatusBadge status={activeRide.status} /><span className="muted">#{activeRide.id.slice(-7)}</span></div>
              <h3>{prettyZone(activeRide.pickupZone)} <span>→</span> {prettyZone(activeRide.destinationZone)}</h3>
              <div className="metric-grid">
                <div><span>Your fare</span><strong>{money(activeRide.farePoysha)}</strong></div>
                <div><span>Seats</span><strong>{activeRide.seats}</strong></div>
                <div><span>Pool</span><strong>{activeRide.isPooled ? `+${activeRide.sharedWithCount}` : "Solo"}</strong></div>
                <div><span>Tesla</span><strong>{activeRide.vehicle?.name ?? "Assigning"}</strong></div>
              </div>
              {activeRide.isPooled && activeRide.soloFarePoysha !== activeRide.farePoysha && <p className="saving">Pooling saved you {money(activeRide.soloFarePoysha - activeRide.farePoysha)}.</p>}
              <div className="timeline">{activeRide.history.map((item, index) => <div className="timeline-item" key={`${item.toStatus}-${index}`}><span></span><div><strong>{item.toStatus.replaceAll("_", " ")}</strong><small>{item.note}</small></div></div>)}</div>
              {CANCELLABLE.has(activeRide.status) && <button className="button button-danger button-block" disabled={busy} onClick={() => void cancelRide(activeRide.id)}>Cancel ride</button>}
            </article>
          )}
        </div>
      </section>

      <section className="history-section">
        <div className="section-heading"><div><span className="eyebrow">Audit trail</span><h2>Ride history</h2></div></div>
        <div className="history-grid">{history.length === 0 ? <div className="panel empty"><span>Completed and cancelled rides appear here.</span></div> : history.map((ride) => <article className="panel history-card" key={ride.id}><StatusBadge status={ride.status} /><h3>{prettyZone(ride.pickupZone)} → {prettyZone(ride.destinationZone)}</h3><p>{money(ride.farePoysha)} · {ride.paymentMethod} · {new Date(ride.createdAt).toLocaleString()}</p></article>)}</div>
      </section>
    </main>
  );
}
