"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Logo from "./logo.png";
import Link from "next/link";
import Cookies from "js-cookie";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosClient from "@/lib/axios";
import { setAuthToken } from "@/lib/authToken";

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  // Detect Google OAuth callback from the URL immediately (before session loads)
  const isFromGoogle = searchParams.get("from") === "google";

  // Handle Google OAuth callback.
  // The Payload CMS backend exchange already happened inside auth.ts jwt callback
  // (server-side), so the session already has the correct Payload user ID and token
  // by the time this effect runs. We only need to sync the cookie and redirect.
  useEffect(() => {
    if (!isFromGoogle) return;
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setError("Google sign-in failed. Please try again.");
      return;
    }

    if (status === "authenticated" && session?.user?.email) {
      const payloadToken = session?.user?.["paylaod-token"];

      if (!payloadToken) {
        const googleIdToken = session?.googleIdToken;
        if (!googleIdToken) {
          setError("Google sign-in failed. Please try again.");
          return;
        }
        const doFallbackExchange = async () => {
          try {
            const res = await axiosClient.post("/api/website/google-auth", {
              googleToken: googleIdToken,
            });
            const resData = res.data;
            if (!resData.success || !resData.token) {
              setError(resData.message || "Google sign-in failed. Please try again.");
              return;
            }
            Cookies.set("paylaod-token", resData.token, { expires: 7 });
            setAuthToken(resData.token);
            await update({
              user: {
                id: String(resData.user?.id || resData.user?._id || ""),
                firstName: resData.user?.firstName ?? "",
                lastName: resData.user?.lastName ?? "",
                profileImage: resData.user?.profileImage ?? null,
                stripeCustomerId: resData.user?.stripeCustomerId ?? null,
                "paylaod-token": resData.token,
                isNewUser: resData.isNewUser ?? false,
                success: true,
              },
            });
            const redirectParam = searchParams.get("redirect") || "/";
            if (resData.isNewUser) {
              router.push(`/auth/create-profile?redirect=${encodeURIComponent(redirectParam)}`);
            } else {
              router.push(redirectParam);
            }
          } catch (e) {
            setError(
              e?.response?.data?.message || e?.message || "Google sign-in failed. Please try again.",
            );
          }
        };
        doFallbackExchange();
        return;
      }

      Cookies.set("paylaod-token", payloadToken, { expires: 7 });
      setAuthToken(payloadToken);

      const redirectParam = searchParams.get("redirect") || "/";
      if (session.user?.isNewUser) {
        router.push(
          `/auth/create-profile?redirect=${encodeURIComponent(redirectParam)}`,
        );
      } else {
        router.push(redirectParam);
      }
    }
  }, [status, session, isFromGoogle, searchParams, router]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
    script.async = true;
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) document.head.removeChild(script);
    };
  }, []);

  // When this page is the OAuth callback target, never show the auth form.
  // Show a plain "Signing you in…" screen while the useEffect above redirects.
  // If something went wrong (e.g. backend exchange failed), show the error.
  if (isFromGoogle) {
    return (
      <div className={styles.Main}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: "16px",
          }}
        >
          {error ? (
            <>
              <p style={{ color: "#c0392b", fontSize: "15px" }}>{error}</p>
              <button
                onClick={() => router.push("/auth")}
                style={{
                  background: "none",
                  border: "none",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#2F362A",
                }}
              >
                Back to sign in
              </button>
            </>
          ) : (
            <p style={{ fontSize: "15px", color: "#2F362A" }}>
              Signing you in…
            </p>
          )}
        </div>
      </div>
    );
  }

  async function handleContinue(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
      setError("Invalid email format");
      setLoading(false);
      return;
    }

    sessionStorage.setItem("email", email);

    try {
      // STEP 1: Validate email and check user status
      const signupRes = await axiosClient.post("api/otp/send-web", {
        email,
      });
      console.log(signupRes);

      const signupJson = signupRes.data;

      // Check if signup route failed
      if (signupRes.status !== 200 || signupJson.success === false) {
        setError(signupJson.message || "Email validation failed");
        setLoading(false);
        return;
      }

      if (signupJson.success === true) {
        const redirectParam = searchParams.get("redirect");
        const verifyUrl = redirectParam
          ? `/auth/verify?redirect=${encodeURIComponent(redirectParam)}`
          : "/auth/verify";
        router.push(verifyUrl);
      }
    } catch (e) {
      setError(e.response.data.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleSignIn() {
    const redirectParam = searchParams.get("redirect");
    const callbackUrl = redirectParam
      ? `/auth?from=google&redirect=${encodeURIComponent(redirectParam)}`
      : "/auth?from=google";
    signIn("google", {
      callbackUrl,
    });
  }

  async function handleAppleSignIn() {
    setError("");
    setAppleLoading(true);
    try {
      window.AppleID.auth.init({
        clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID,
        scope: "name email",
        redirectURI: process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI,
        usePopup: true,
      });

      const response = await window.AppleID.auth.signIn();
      const idToken = response?.authorization?.id_token;
      const firstName = response?.user?.name?.firstName || "";
      const lastName = response?.user?.name?.lastName || "";

      if (!idToken) {
        setError("Apple sign-in failed. Please try again.");
        return;
      }

      const res = await axiosClient.post("/api/app/apple-auth", {
        appleToken: idToken,
        givenName: firstName,
        familyName: lastName,
      });
      const resData = res.data;

      if (!resData.token) {
        setError(resData.message || "Apple sign-in failed. Please try again.");
        return;
      }

      Cookies.set("paylaod-token", resData.token, { expires: 7 });
      setAuthToken(resData.token);

      const result = await signIn("otp", {
        user: JSON.stringify(resData.user || {}),
        token: resData.token,
        redirect: false,
      });

      if (result?.error) {
        setError("Apple sign-in failed. Please try again.");
        return;
      }

      const redirectParam = searchParams.get("redirect") || "/";
      if (resData.isNewUser || resData.needsContactEmail) {
        router.push(`/auth/create-profile?redirect=${encodeURIComponent(redirectParam)}`);
      } else {
        router.push(redirectParam);
      }
    } catch (err) {
      const cancelErrors = ["popup_closed_by_user", "user_trigger_new_signin_flow"];
      if (cancelErrors.includes(err?.error)) return;
      setError(
        err?.response?.data?.message || err?.message || "Apple sign-in failed. Please try again."
      );
    } finally {
      setAppleLoading(false);
    }
  }

  return (
    <>
      <div className={styles.Main}>
        <div className={styles.MainCoantiner}>
          <div className={styles.LeftCoantiner}>
            <video
              autoPlay
              muted
              loop
              playsInline
              className={styles.BgVideo}
            >
              <source src="/videos/loginVid.mp4" type="video/mp4" />
            </video>
            <div className="styles.text1">
              <h4>Pure Craft. Uncompromising Quality.</h4>
              <p>
                Dedicated to the master transformation of green coffee into
                world-class specialty beans for you
              </p>
            </div>
          </div>
          <div className={styles.RightCoantiner}>
            <form onSubmit={handleContinue} className={styles.RightTop}>
              <div className={styles.RightTopOne}>
                <div className={styles.RightTopOneTop}>
                  <Image src={Logo} alt="White Mantis Logo" />
                </div>
                <div className={styles.RightTopOneBottom}>
                  <div className={styles.RightTopOneBottomTop}>
                    <h3>ENTER YOUR EMAIL</h3>
                    <p>We'll send a quick code - no password needed.</p>
                  </div>
                  <div className={styles.RightTopOneBottomBottom}>
                    {error && <p className={styles.errorMessage}>{error}</p>}
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      className={styles.inputemail}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      suppressHydrationWarning
                    />
                  </div>
                </div>
              </div>
              <div className={styles.RightTopTwo}>
                <button
                  type="submit"
                  className={styles.ctacontinue}
                  disabled={loading || !email}
                >
                  {loading ? "Processing..." : "Send Code"}
                </button>
                <p>
                  By continuing, you agree to our{" "}
                  <Link href="/terms-and-conditions" className={styles.Tnc}>
                    Terms & Privacy Policy
                  </Link>
                </p>
              </div>
            </form>
            <div className={styles.RightBottom}>
              <div className={styles.RightBottomOne}>
                <div className={styles.line}></div>
                <div className={styles.textor}>
                  <p>or continue with</p>
                </div>
                <div className={styles.line}></div>
              </div>
              <div className={styles.socials}>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className={styles.googleButton}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                    padding: 0,
                  }}
                  aria-label="Sign in with Google"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g clipPath="url(#clip0_3069_17144)">
                      <path
                        d="M23.9995 12.0386C23.9995 11.0554 23.9178 10.3378 23.7411 9.59375H12.25V14.0317H18.995C18.8591 15.1346 18.1248 16.7956 16.4928 17.9117L16.47 18.0603L20.1032 20.8105L20.355 20.835C22.6667 18.7488 23.9995 15.6794 23.9995 12.0386Z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12.2383 23.9139C15.5428 23.9139 18.3169 22.8508 20.3432 21.0172L16.4811 18.0939C15.4476 18.7981 14.0605 19.2898 12.2383 19.2898C9.00175 19.2898 6.25478 17.2037 5.27556 14.3203L5.13203 14.3322L1.35409 17.189L1.30469 17.3232C3.31731 21.2297 7.45141 23.9139 12.2383 23.9139Z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.27634 14.3228C5.01797 13.5787 4.86844 12.7814 4.86844 11.9576C4.86844 11.1338 5.01797 10.3365 5.26275 9.59244L5.25591 9.43397L1.43062 6.53125L1.30547 6.58942C0.475969 8.21052 0 10.0309 0 11.9576C0 13.8843 0.475969 15.7047 1.30547 17.3258L5.27634 14.3228Z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12.2383 4.62403C14.5365 4.62403 16.0867 5.59401 16.9707 6.40461L20.4248 3.10928C18.3034 1.1826 15.5428 0 12.2383 0C7.45141 0 3.31731 2.68406 1.30469 6.59056L5.26197 9.59359C6.25478 6.7102 9.00175 4.62403 12.2383 4.62403Z"
                        fill="#EB4335"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_3069_17144">
                        <rect width="24" height="24" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                  
                </button>
                <button
                  onClick={handleAppleSignIn}
                  disabled={loading || appleLoading}
                  className={styles.googleButton}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: loading || appleLoading ? "not-allowed" : "pointer",
                    opacity: loading || appleLoading ? 0.6 : 1,
                    padding: 0,
                  }}
                  aria-label="Sign in with Apple"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M17.0435 12.7249C17.0279 10.8504 17.8935 9.44785 19.6404 8.41441C18.6607 7.00535 17.1638 6.22754 15.1794 6.07629C13.3013 5.92816 11.2544 7.14472 10.5076 7.14472C9.71729 7.14472 7.90603 6.12629 6.47197 6.12629C3.50978 6.17316 0.359985 8.46129 0.359985 13.1249C0.359985 14.5218 0.611235 15.9656 1.11373 17.4562C1.78435 19.4093 4.25291 24.126 6.82416 24.0478C8.15853 24.0165 9.09666 23.1196 10.8279 23.1196C12.5123 23.1196 13.3779 24.0478 14.8654 24.0478C17.4522 24.0087 19.6873 19.7249 20.3267 17.7718C16.961 16.1624 17.0435 12.8187 17.0435 12.7249ZM14.0813 4.22629C15.5063 2.53129 15.3738 0.985039 15.3269 0.454102C14.0657 0.532227 12.6004 1.31629 11.7663 2.28754C10.8435 3.33254 10.3254 4.62691 10.4423 6.04535C11.8073 6.14941 13.0529 5.44472 14.0813 4.22629Z"
                      fill="#2F362A"
                    />
                  </svg>
                
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Auth() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
