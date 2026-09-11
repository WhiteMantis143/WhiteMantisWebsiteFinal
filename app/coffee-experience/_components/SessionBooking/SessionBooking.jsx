"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./SessionBooking.module.css";
import axiosClient from "@/lib/axios";

const DUBAI_TZ = "Asia/Dubai";
const WEEKDAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

// --- Date helpers ---------------------------------------------------------
// availableDates[].date / timeSlots[].time are stored by Payload as full
// ISO instants (date-only / time-only pickers still produce a timestamp).
// We read the calendar day from the UTC components of `date` and the
// hour/minute from the UTC components of `time` — this mirrors exactly how
// the backend (event-checkout/route.ts) combines them server-side, so a
// slot that looks bookable here will also be accepted there.

function isoDayKey(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function combineUtcDayWithTime(dateIso, timeIso) {
  const d = new Date(dateIso);
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  if (timeIso) {
    const t = new Date(timeIso);
    start.setUTCHours(t.getUTCHours(), t.getUTCMinutes(), 0, 0);
  }
  return start;
}

// The venue is a fixed physical location in Dubai, so the time-of-day is
// always shown in Dubai local time regardless of the visitor's own timezone.
function formatSlotTime(timeIso) {
  const d = new Date(timeIso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: DUBAI_TZ,
  });
}

function formatDayLabel(key) {
  const [y, m, day] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, day));
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function monthLabel(year, month) {
  const d = new Date(Date.UTC(year, month, 1));
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const firstWeekday = (firstOfMonth.getUTCDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  const cells = [];
  const cursor = new Date(Date.UTC(year, month, 1 - firstWeekday));
  for (let i = 0; i < totalCells; i++) {
    cells.push({
      key: isoDayKey(cursor),
      day: cursor.getUTCDate(),
      inMonth: cursor.getUTCMonth() === month,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return cells;
}

const SessionBooking = () => {
  const router = useRouter();
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);

  const [viewYear, setViewYear] = useState(null);
  const [viewMonth, setViewMonth] = useState(null);
  const [step, setStep] = useState("calendar"); // 'calendar' | 'slots'
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    axiosClient
      .get("/api/coffee-experience?where[isActive][equals]=true&limit=1")
      .then((res) => {
        const doc = Array.isArray(res.data?.docs) ? res.data.docs[0] : null;
        if (!cancelled) setExperience(doc || null);
      })
      .catch((e) => console.error("SessionBooking load error", e))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Build { "YYYY-MM-DD": { dateId, bookableSlots, allSlots } } from the
  // experience's availableDates, resolving real bookability per slot.
  const dateMeta = useMemo(() => {
    const now = Date.now();
    const meta = {};
    (experience?.availableDates || []).forEach((entry) => {
      if (!entry?.date) return;
      const key = isoDayKey(new Date(entry.date));
      const slots = (entry.timeSlots || []).map((slot) => {
        const start = combineUtcDayWithTime(entry.date, slot.time);
        const remaining = Math.max(0, (Number(slot.capacity) || 0) - (Number(slot.bookedCount) || 0));
        return { ...slot, start, remaining, isPast: start.getTime() < now };
      });
      meta[key] = {
        dateId: entry.id,
        slots,
        bookableSlots: slots.filter((s) => !s.isPast && s.remaining > 0),
      };
    });
    return meta;
  }, [experience]);

  const sortedKeys = useMemo(() => Object.keys(dateMeta).sort(), [dateMeta]);
  const bookableKeys = useMemo(
    () => sortedKeys.filter((k) => dateMeta[k].bookableSlots.length > 0),
    [sortedKeys, dateMeta],
  );

  // Default the calendar to the month of the earliest bookable date.
  useEffect(() => {
    if (viewYear !== null || sortedKeys.length === 0) return;
    const anchorKey = bookableKeys[0] || sortedKeys[0];
    const [y, m] = anchorKey.split("-").map(Number);
    setViewYear(y);
    setViewMonth(m - 1);
  }, [sortedKeys, bookableKeys, viewYear]);

  const monthBounds = useMemo(() => {
    if (sortedKeys.length === 0) return null;
    const toIdx = (k) => {
      const [y, m] = k.split("-").map(Number);
      return y * 12 + (m - 1);
    };
    const idxs = sortedKeys.map(toIdx);
    return { min: Math.min(...idxs), max: Math.max(...idxs) };
  }, [sortedKeys]);

  if (loading || !experience) return null;

  const currentIdx = viewYear !== null ? viewYear * 12 + viewMonth : null;
  const canGoPrev = monthBounds && currentIdx !== null && currentIdx > monthBounds.min;
  const canGoNext = monthBounds && currentIdx !== null && currentIdx < monthBounds.max;

  const goPrevMonth = () => {
    if (!canGoPrev) return;
    const idx = viewYear * 12 + viewMonth - 1;
    setViewYear(Math.floor(idx / 12));
    setViewMonth(((idx % 12) + 12) % 12);
  };

  const goNextMonth = () => {
    if (!canGoNext) return;
    const idx = viewYear * 12 + viewMonth + 1;
    setViewYear(Math.floor(idx / 12));
    setViewMonth(((idx % 12) + 12) % 12);
  };

  const grid = viewYear !== null ? buildMonthGrid(viewYear, viewMonth) : [];
  const selectedMeta = selectedDateKey ? dateMeta[selectedDateKey] : null;

  const goToCheckout = () => {
    if (!selectedMeta || !selectedTimeSlotId) return;
    router.push(
      `/event-checkout?id=${experience.id}&type=coffee-experience&dateId=${selectedMeta.dateId}&timeSlotId=${selectedTimeSlotId}`,
    );
  };

  return (
    <div className={styles.main}>
      <div className={styles.MainContainer}>
        <div className={styles.AboutSide}>
          <h3 className={styles.SectionHeading}>About the Session</h3>
          <div className={styles.AboutBody}>
            <div className={styles.AboutImage}>
              {experience.aboutSession?.image?.url && (
                <img
                  src={`${process.env.NEXT_PUBLIC_SERVER_URL || ""}${experience.aboutSession.image.url}`}
                  alt="About the session"
                />
              )}
            </div>
            <div className={styles.AboutInfo}>
              {(experience.aboutSession?.details || []).map((row, i) => (
                <div className={styles.InfoRow} key={row.id || i}>
                  <h4>{row.label}</h4>
                  <p>{row.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.ReserveSide}>
          <h3 className={styles.SectionHeading}>Reserve Your Spot</h3>

          {sortedKeys.length === 0 ? (
            <div className={styles.CalendarBox}>
              <p className={styles.EmptyCalendarState}>
                No dates are currently open for booking — check back soon.
              </p>
            </div>
          ) : step === "calendar" ? (
            <>
            <div className={styles.CalendarBox}>
              <div className={styles.CalendarHeader}>
                <button
                  type="button"
                  className={styles.NavButton}
                  onClick={goPrevMonth}
                  disabled={!canGoPrev}
                  aria-label="Previous month"
                >
                  &#8249;
                </button>
                <h4>{viewYear !== null ? monthLabel(viewYear, viewMonth) : ""}</h4>
                <button
                  type="button"
                  className={styles.NavButton}
                  onClick={goNextMonth}
                  disabled={!canGoNext}
                  aria-label="Next month"
                >
                  &#8250;
                </button>
              </div>

              <div className={styles.WeekRow}>
                {WEEKDAY_LABELS.map((w) => (
                  <div key={w}>{w}</div>
                ))}
              </div>

              <div className={styles.DayGrid}>
                {grid.map((cell) => {
                  const meta = dateMeta[cell.key];
                  const isBookable = cell.inMonth && meta && meta.bookableSlots.length > 0;
                  const isSoldOut = cell.inMonth && meta && meta.bookableSlots.length === 0;
                  const isSelected = cell.key === selectedDateKey;
                  const cls = [
                    styles.DayCell,
                    !cell.inMonth ? styles.DayCellOutside : "",
                    isBookable ? styles.DayCellBookable : "",
                    isSoldOut ? styles.DaySoldOut : "",
                    isSelected ? styles.DaySelected : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <button
                      type="button"
                      key={cell.key + (cell.inMonth ? "-in" : "-out")}
                      className={cls}
                      disabled={!isBookable}
                      onClick={() => setSelectedDateKey(cell.key)}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.CalendarFooterRow}>
              <div className={styles.PriceBlock}>
                <p className={styles.PriceLabel}>Price</p>
                <p className={styles.PriceValue}>
                  AED {Number(experience.price || 0).toFixed(2)} Per person
                </p>
              </div>
              <button
                type="button"
                className={styles.NextButton}
                disabled={!selectedMeta}
                onClick={() => setStep("slots")}
              >
                Next
              </button>
            </div>
            </>
          ) : (
            <div className={styles.CalendarBox}>
              <p className={styles.SelectedDateLabel}>{formatDayLabel(selectedDateKey)}</p>
              <p className={styles.SlotSectionLabel}>Select a Time</p>

              <div className={styles.SlotsGrid}>
                {selectedMeta.bookableSlots.map((slot) => (
                  <button
                    type="button"
                    key={slot.id}
                    className={`${styles.SlotButton} ${
                      selectedTimeSlotId === slot.id ? styles.SlotButtonSelected : ""
                    }`}
                    onClick={() => setSelectedTimeSlotId(slot.id)}
                  >
                    {formatSlotTime(slot.time)}
                  </button>
                ))}
              </div>

              <div className={styles.StepFooterRow}>
                <button
                  type="button"
                  className={styles.BackButton}
                  onClick={() => {
                    setStep("calendar");
                    setSelectedTimeSlotId(null);
                  }}
                >
                  &#8249; Back to Calendar
                </button>
                <button
                  type="button"
                  className={styles.NextButton}
                  disabled={!selectedTimeSlotId}
                  onClick={goToCheckout}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionBooking;
