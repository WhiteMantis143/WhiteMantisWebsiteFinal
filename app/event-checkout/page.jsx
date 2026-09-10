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

// Academy events are always single-seat bookings — multi-seat is a
// Coffee-Experience-only option the admin will be able to opt into later.
const SEATS = 1;

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

function PaymentForm({ event, isGuest }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [isExpressAvailable, setIsExpressAvailable] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const capacity = Number(event.capacity) || 0;
  const bookedCount = Number(event.bookedCount) || 0;
  const seatsRemaining = Math.max(0, capacity - bookedCount);

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

      const res = await axiosClient.post("/api/checkout/event-checkout", {
        eventId: event.id,
        eventType: "workshop",
        seats: SEATS,
        guestName: isGuest ? guestName.trim() : undefined,
        guestPhone: isGuest ? guestPhone.trim() : undefined,
        guestEmail: isGuest ? guestEmail.trim() : undefined,
      });

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

function EventCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status } = useSession();
  const eventId = searchParams.get("id");

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!eventId) {
      router.push("/academy");
      return;
    }
    let cancelled = false;
    axiosClient
      .get(`/api/workshop/${eventId}`)
      .then((res) => {
        if (!cancelled) setEvent(res.data);
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
  }, [eventId, router]);

  if (loading || status === "loading") {
    return (
      <div className={styles.Main}>
        <div style={{ textAlign: "center", padding: "150px 0 80px" }}>
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (loadError || !event) {
    return (
      <div className={styles.Main}>
        <div style={{ textAlign: "center", padding: "150px 0 80px" }}>
          <p>{loadError || "Event not found."}</p>
        </div>
      </div>
    );
  }

  const capacity = Number(event.capacity) || 0;
  const bookedCount = Number(event.bookedCount) || 0;
  const seatsRemaining = Math.max(0, capacity - bookedCount);
  const price = Number(event.price) || 0;
  const amount = price * SEATS;
  const isGuest = status !== "authenticated";

  if (seatsRemaining === 0) {
    return (
      <div className={styles.Main}>
        <div style={{ textAlign: "center", padding: "150px 0 80px" }}>
          <h3>Sorry, this event is fully booked</h3>
          <p>All seats for {event.title} have been taken.</p>
          <button onClick={() => router.push("/academy")} className={styles.Pay} style={{ maxWidth: 240, margin: "20px auto 0" }}>
            Back to Academy
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
        <Elements stripe={stripePromise} options={stripeOptions} key={eventId}>
          <PaymentForm event={event} isGuest={isGuest} />
        </Elements>

        <div className={styles.Right}>
          <div className={styles.RightOne}>
            <h3>Order Summary</h3>
          </div>

          <div className={styles.RightTwo}>
            <div className={styles.SummaryItem}>
              <div className={styles.ItemImage}>
                <img
                  src={formatImageUrl(event.workshopImage) || placeholderImage.src}
                  alt={event.title}
                />
              </div>
              <div className={styles.ItemInfo}>
                <div className={styles.ItemName}>{event.title}</div>
                <div className={styles.ItemSubRow}>
                  {formatDateStr(event.eventDate)} &middot;{" "}
                  {formatTimeStr(event.eventTime)}
                </div>
              </div>
              <div className={styles.ItemPrice}>AED {price.toFixed(2)}</div>
            </div>
          </div>

          <div className={styles.RightThree}>
            <div className={styles.Total}>
              <p>Total</p>
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
