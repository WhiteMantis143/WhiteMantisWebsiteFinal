"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import axiosClient from "@/lib/axios";
import { formatImageUrl } from "@/lib/imageUtils";
import placeholderImage from "../checkout/1.png";
import styles from "./page.module.css";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
);

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

// Coffee Experience dates/times are read the same way the booking calendar
// and the backend (event-checkout/route.ts) do: the day comes from the UTC
// components of `date`, the time-of-day is shown in the venue's own
// timezone (Dubai) regardless of the visitor's browser timezone.
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

function ExpressCheckoutSection({ onExpressConfirm, isAvailable, setIsAvailable }) {
  return (
    <div className={styles.One} style={!isAvailable ? { display: "none" } : {}}>
      <p style={{ fontWeight: "400" }}>EXPRESS CHECKOUT</p>
      <ExpressCheckoutElement
        options={{ paymentMethods: { applePay: "always", googlePay: "always" } }}
        onConfirm={onExpressConfirm}
        onClick={({ resolve }) =>
          resolve({ emailRequired: true, phoneNumberRequired: true })
        }
        onReady={({ availablePaymentMethods }) => {
          if (
            availablePaymentMethods &&
            Object.values(availablePaymentMethods).some(Boolean)
          ) {
            setIsAvailable(true);
          }
        }}
        onLoadError={() => setIsAvailable(false)}
      />
    </div>
  );
}

function PaymentForm({ eventId, eventType, dateId, timeSlotId, seats, seatsRemaining, isGuest }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [isExpressAvailable, setIsExpressAvailable] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const runCheckout = async () => {
    setError("");

    if (isGuest && !guestEmail.trim()) {
      setError("Please enter your email to continue.");
      return false;
    }

    setIsProcessing(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || "Please check your payment details");
        setIsProcessing(false);
        return false;
      }

      const body = {
        eventId,
        eventType,
        seats,
        guestName: isGuest ? guestName.trim() : undefined,
        guestPhone: isGuest ? guestPhone.trim() : undefined,
        guestEmail: isGuest ? guestEmail.trim() : undefined,
      };
      if (eventType === "coffee-experience") {
        body.dateId = dateId;
        body.timeSlotId = timeSlotId;
      }

      const res = await axiosClient.post("/api/checkout/event-checkout", body);

      const data = res.data;
      if (!data?.success || !data?.clientSecret) {
        throw new Error(data?.error || "Could not start checkout");
      }

      const successPath = `/event-checkout/success?bookingId=${data.bookingId}${
        data.guestAccessToken ? `&token=${data.guestAccessToken}` : ""
      }`;

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}${successPath}&cs=1`,
        },
        redirect: "if_required",
      });

      if (confirmError) {
        setError(confirmError.message || "Payment failed, please try again");
        setIsProcessing(false);
        return false;
      }

      sessionStorage.setItem("event_checkout_success", "1");
      router.push(successPath);
      return true;
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || "Something went wrong",
      );
      setIsProcessing(false);
      return false;
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    await runCheckout();
  };

  return (
    <form onSubmit={handlePay} className={styles.Left}>
      <ExpressCheckoutSection
        isAvailable={isExpressAvailable}
        setIsAvailable={setIsExpressAvailable}
        onExpressConfirm={async () => {
          if (!stripe || !elements) return;
          await runCheckout();
        }}
      />

      {isGuest && (
        <div className={styles.Two}>
          <div className={styles.TwoOne}>
            <h3>Contact</h3>
            <a href="/auth">
              <p>Sign In</p>
            </a>
          </div>
          <div className={styles.TwoTwo}>
            <input
              type="text"
              placeholder="Full name (optional)"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className={styles.Input}
            />
            <input
              type="email"
              placeholder="Email address"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className={styles.Input}
              required
            />
            <input
              type="tel"
              placeholder="Phone number (optional)"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              className={styles.Input}
            />
          </div>
        </div>
      )}

      <div className={styles.Five}>
        <h3>Payment</h3>
        <p>All transactions are secure and encrypted.</p>
        <div className={styles.PaymentContainer}>
          <div className={styles.PaymentBody}>
            <div className={styles.StripeInput}>
              <PaymentElement />
            </div>
            {error && <span className={styles.ErrorMessage}>{error}</span>}
          </div>
        </div>
      </div>

      <div className={styles.Six}>
        <button
          type="submit"
          className={styles.Pay}
          disabled={isProcessing || seatsRemaining === 0}
        >
          {isProcessing ? "Processing..." : "Pay Now"}
        </button>
      </div>
    </form>
  );
}

function SeatStepper({ seats, setSeats, max }) {
  return (
    <div className={styles.SeatStepper}>
      <button
        type="button"
        className={styles.SeatStepperBtn}
        onClick={() => setSeats((s) => Math.max(1, s - 1))}
        disabled={seats <= 1}
        aria-label="Decrease seats"
      >
        −
      </button>
      <span className={styles.SeatStepperCount}>{seats}</span>
      <button
        type="button"
        className={styles.SeatStepperBtn}
        onClick={() => setSeats((s) => Math.min(max, s + 1))}
        disabled={seats >= max}
        aria-label="Increase seats"
      >
        +
      </button>
    </div>
  );
}

function EventCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status } = useSession();
  const eventId = searchParams.get("id");
  const eventType = searchParams.get("type") === "coffee-experience" ? "coffee-experience" : "workshop";
  const dateId = searchParams.get("dateId");
  const timeSlotId = searchParams.get("timeSlotId");
  const backHref = eventType === "coffee-experience" ? "/coffee-experience" : "/academy";
  const backLabel = eventType === "coffee-experience" ? "Back to Coffee Experience" : "Back to Academy";

  const [rawDoc, setRawDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [seats, setSeats] = useState(1);

  useEffect(() => {
    if (!eventId) {
      router.push(backHref);
      return;
    }
    let cancelled = false;
    const url =
      eventType === "coffee-experience"
        ? `/api/coffee-experience/${eventId}`
        : `/api/workshop/${eventId}`;

    axiosClient
      .get(url)
      .then((res) => {
        if (!cancelled) setRawDoc(res.data);
      })
      .catch(() => {
        if (!cancelled) setLoadError("This event could not be found.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, eventType]);

  if (loading || status === "loading") {
    return (
      <div className={styles.Main}>
        <div style={{ textAlign: "center", padding: "150px 0 80px" }}>
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }

  // --- Normalize a workshop doc or a coffee-experience doc + selected
  // date/time slot into one shared shape the rest of this page renders. ---
  let booking = null;
  let normalizeError = "";

  if (rawDoc) {
    if (eventType === "workshop") {
      booking = {
        title: rawDoc.title,
        imageUrl: formatImageUrl(rawDoc.workshopImage) || placeholderImage.src,
        dateLabel: formatDateStr(rawDoc.eventDate),
        timeLabel: formatTimeStr(rawDoc.eventTime),
        pricePerSeat: Number(rawDoc.price) || 0,
        seatsRemaining: Math.max(0, (Number(rawDoc.capacity) || 0) - (Number(rawDoc.bookedCount) || 0)),
        allowMultipleSeats: false,
        maxSeatsPerBooking: 1,
      };
    } else {
      const dateEntry = (rawDoc.availableDates || []).find((d) => String(d.id) === String(dateId));
      const slot = dateEntry?.timeSlots?.find((s) => String(s.id) === String(timeSlotId));
      if (!dateEntry || !slot) {
        normalizeError = "This time slot could not be found — please pick a date and time again.";
      } else {
        booking = {
          title: rawDoc.title,
          imageUrl: formatImageUrl(rawDoc.heroImage) || placeholderImage.src,
          dateLabel: formatExperienceDateStr(dateEntry.date),
          timeLabel: formatExperienceTimeStr(slot.time),
          pricePerSeat: Number(rawDoc.price) || 0,
          seatsRemaining: Math.max(0, (Number(slot.capacity) || 0) - (Number(slot.bookedCount) || 0)),
          allowMultipleSeats: !!rawDoc.allowMultipleSeats,
          maxSeatsPerBooking: Number(rawDoc.maxSeatsPerBooking) || 6,
        };
      }
    }
  }

  const errorMessage = loadError || normalizeError;

  if (errorMessage || !booking) {
    return (
      <div className={styles.Main}>
        <div style={{ textAlign: "center", padding: "150px 0 80px" }}>
          <p>{errorMessage || "Event not found."}</p>
        </div>
      </div>
    );
  }

  const maxSeats = Math.max(1, Math.min(booking.maxSeatsPerBooking, booking.seatsRemaining));
  const effectiveSeats = booking.allowMultipleSeats ? Math.min(seats, maxSeats) : 1;
  const isGuest = status !== "authenticated";
  const amount = booking.pricePerSeat * effectiveSeats;

  if (booking.seatsRemaining === 0) {
    return (
      <div className={styles.Main}>
        <div style={{ textAlign: "center", padding: "150px 0 80px" }}>
          <h3>Sorry, this event is fully booked</h3>
          <p>All seats for {booking.title} have been taken.</p>
          <button
            onClick={() => router.push(backHref)}
            className={styles.Pay}
            style={{ maxWidth: 240, margin: "20px auto 0" }}
          >
            {backLabel}
          </button>
        </div>
      </div>
    );
  }

  const stripeOptions = {
    appearance: { theme: "stripe" },
    mode: "payment",
    amount: Math.max(100, Math.round(amount * 100)),
    currency: "aed",
  };

  return (
    <div className={styles.Main}>
      <div className={styles.MainConatiner}>
        <Elements
          stripe={stripePromise}
          options={stripeOptions}
          key={`${eventId}-${dateId || ""}-${timeSlotId || ""}-${effectiveSeats}`}
        >
          <PaymentForm
            eventId={eventId}
            eventType={eventType}
            dateId={dateId}
            timeSlotId={timeSlotId}
            seats={effectiveSeats}
            seatsRemaining={booking.seatsRemaining}
            isGuest={isGuest}
          />
        </Elements>

        <div className={styles.Right}>
          <div className={styles.RightOne}>
            <h3>Order Summary</h3>
          </div>

          <div className={styles.RightTwo}>
            <div className={styles.SummaryItem}>
              <div className={styles.ItemImage}>
                <img src={booking.imageUrl} alt={booking.title} />
              </div>
              <div className={styles.ItemInfo}>
                <div className={styles.ItemName}>{booking.title}</div>
                <div className={styles.ItemSubRow}>
                  {booking.dateLabel} &middot; {booking.timeLabel}
                </div>
                {booking.allowMultipleSeats && (
                  <div className={styles.ItemSeats}>
                    <span>Seats</span>
                    <SeatStepper seats={seats} setSeats={setSeats} max={maxSeats} />
                  </div>
                )}
              </div>
              <div className={styles.ItemPrice}>AED {booking.pricePerSeat.toFixed(2)}</div>
            </div>
          </div>

          <div className={styles.RightThree}>
            <div className={styles.Total}>
              <p>Total{effectiveSeats > 1 ? ` (${effectiveSeats} seats)` : ""}</p>
              <h4>AED {amount.toFixed(2)}</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventCheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EventCheckoutContent />
    </Suspense>
  );
}
