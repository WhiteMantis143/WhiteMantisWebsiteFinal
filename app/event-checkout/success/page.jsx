"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axiosClient from "@/lib/axios";
import styles from "./page.module.css";

function formatDateStr(val) {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeStr(val) {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Same date-combining logic used server-side — builds the actual start
// instant from the event's separate date + time fields.
function buildEventStart(event) {
  if (!event?.eventDate) return null;
  const start = new Date(event.eventDate);
  if (event.eventTime) {
    const t = new Date(event.eventTime);
    start.setHours(t.getHours(), t.getMinutes(), 0, 0);
  }
  return start;
}

function buildGoogleCalendarLink(event) {
  const start = buildEventStart(event);
  if (!start) return null;
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title || "White Mantis Academy Session",
    dates: `${fmt(start)}/${fmt(end)}`,
    location: "White Mantis Roastery, Dubai",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("bookingId");
  const token = searchParams.get("token");

  const [isAllowed, setIsAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);

  // Same guard pattern as the store checkout success page — only allow
  // access right after a real checkout, not by guessing a booking id in the URL.
  useEffect(() => {
    const fromSessionStorage =
      sessionStorage.getItem("event_checkout_success") === "1";
    const fromUrl = searchParams.get("cs") === "1";
    if (!fromSessionStorage && !fromUrl) {
      router.replace("/academy");
    } else {
      setIsAllowed(true);
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (!isAllowed) return;
    if (!bookingId) {
      setLoading(false);
      return;
    }

    const params = {};
    if (token) params.token = token;

    axiosClient
      .get(`/api/event-bookings/${bookingId}?depth=2`, { params })
      .then((res) => setBooking(res.data))
      .catch((err) => {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Could not load your booking details",
        );
      })
      .finally(() => setLoading(false));
  }, [isAllowed, bookingId, token]);

  if (!isAllowed) return null;

  if (loading) {
    return (
      <div className={styles.Main}>
        <p style={{ textAlign: "center", padding: 60 }}>Loading...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className={styles.Main}>
        <div className={styles.Box}>
          <h2>Payment received</h2>
          <p>
            Your booking is confirmed — we couldn&apos;t load the full
            details here, but a confirmation email is on its way.
          </p>
          {error && <p className={styles.ErrorMessage}>{error}</p>}
        </div>
      </div>
    );
  }

  const event =
    booking.event && typeof booking.event === "object"
      ? booking.event.value
      : null;
  const googleCalLink = event ? buildGoogleCalendarLink(event) : null;

  return (
    <div className={styles.Main}>
      <div className={styles.Box}>
        <div className={styles.CheckIcon}>✓</div>
        <h2>Booking Confirmed!</h2>
        <p className={styles.SubText}>
          Booking #{booking.id} &mdash; see you there.
        </p>

        {event && (
          <div className={styles.EventCard}>
            <h3>{event.title}</h3>
            <p>
              {formatDateStr(event.eventDate)} &middot;{" "}
              {formatTimeStr(event.eventTime)}
            </p>
          </div>
        )}

        <div className={styles.DetailsRow}>
          <span>Seats</span>
          <strong>{booking.seats}</strong>
        </div>
        <div className={styles.DetailsRow}>
          <span>Total Paid</span>
          <strong>AED {Number(booking.amountPaid || 0).toFixed(2)}</strong>
        </div>

        <p className={styles.EmailNote}>
          A confirmation email with a calendar invite (works with Apple
          Calendar and Outlook) has been sent to your inbox.
        </p>

        {googleCalLink && (
          <a
            href={googleCalLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.CalendarButton}
          >
            Add to Google Calendar
          </a>
        )}

        <button
          onClick={() => router.push("/academy")}
          className={styles.SecondaryButton}
        >
          Back to Academy
        </button>
      </div>
    </div>
  );
}

export default function EventCheckoutSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
