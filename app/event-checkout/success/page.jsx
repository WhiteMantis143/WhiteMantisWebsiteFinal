"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axiosClient from "@/lib/axios";
import styles from "./page.module.css";

const DUBAI_TZ = "Asia/Dubai";

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

// Coffee Experience dates/times: day from the UTC components of `date`,
// time-of-day shown in the venue's own timezone — same convention used by
// the booking calendar and the checkout page.
function formatExperienceDateStr(dateIso) {
  if (!dateIso) return "";
  const d = new Date(dateIso);
  const dayOnly = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return dayOnly.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatExperienceTimeStr(timeIso) {
  if (!timeIso) return "";
  const d = new Date(timeIso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: DUBAI_TZ,
  });
}

// Same date-combining logic used server-side — builds the actual start
// instant from the workshop's separate date + time fields.
function buildWorkshopStart(event) {
  if (!event?.eventDate) return null;
  const start = new Date(event.eventDate);
  if (event.eventTime) {
    const t = new Date(event.eventTime);
    start.setHours(t.getHours(), t.getMinutes(), 0, 0);
  }
  return start;
}

// Normalizes a workshop booking or a coffee-experience booking (which needs
// its specific selected date/time slot looked up) into one shared shape.
function resolveEventDisplay(booking) {
  const relationTo =
    booking?.event && typeof booking.event === "object" ? booking.event.relationTo : null;
  const event =
    booking?.event && typeof booking.event === "object" ? booking.event.value : null;
  if (!event) return null;

  if (relationTo === "coffee-experience") {
    const dateEntry = (event.availableDates || []).find(
      (d) => String(d.id) === String(booking.selectedDateId),
    );
    const slot = dateEntry?.timeSlots?.find(
      (s) => String(s.id) === String(booking.selectedTimeSlotId),
    );

    let start = null;
    if (dateEntry?.date) {
      const d = new Date(dateEntry.date);
      start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      if (slot?.time) {
        const t = new Date(slot.time);
        start.setUTCHours(t.getUTCHours(), t.getUTCMinutes(), 0, 0);
      }
    }

    return {
      title: event.title,
      dateLabel: dateEntry ? formatExperienceDateStr(dateEntry.date) : "",
      timeLabel: slot ? formatExperienceTimeStr(slot.time) : "",
      start,
      backHref: "/coffee-experience",
      backLabel: "Back to Coffee Experience",
    };
  }

  return {
    title: event.title,
    dateLabel: formatDateStr(event.eventDate),
    timeLabel: formatTimeStr(event.eventTime),
    start: buildWorkshopStart(event),
    backHref: "/academy",
    backLabel: "Back to Academy",
  };
}

function buildGoogleCalendarLink(title, start) {
  if (!start) return null;
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title || "White Mantis Session",
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
      router.replace("/");
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

  const display = resolveEventDisplay(booking);
  const googleCalLink = display ? buildGoogleCalendarLink(display.title, display.start) : null;

  return (
    <div className={styles.Main}>
      <div className={styles.Box}>
        <div className={styles.CheckIcon}>✓</div>
        <h2>Booking Confirmed!</h2>
        <p className={styles.SubText}>
          Booking #{booking.id} &mdash; see you there.
        </p>

        {display && (
          <div className={styles.EventCard}>
            <h3>{display.title}</h3>
            <p>
              {display.dateLabel} &middot; {display.timeLabel}
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
          onClick={() => router.push(display?.backHref || "/academy")}
          className={styles.SecondaryButton}
        >
          {display?.backLabel || "Back to Academy"}
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
