"use client";
import React from "react";
import Image from "next/image"; // 1. Import the Next.js Image component
import styles from "./Landing.module.css";
import bgImage from "./AboutUs.png"

const Landing = () => {
  return (
    <>
      <div className={styles.Main}>
        <Image
          src={bgImage}
          alt="Landing Background"
          placeholder="blur" // Optional: adds a blurred loading effect
          quality={100}
          fill // Makes the image fill the parent container
          className={styles.BackgroundImage}
          priority // Tells Next.js to load this image immediately (LCP)
        />

        <div className={styles.Overlay}>
          <div className={styles.Content}>
            <div className={styles.BottomText}>
              <p>
                White Mantis started as Surge Coffee in
                2016 — one of the first specialty roasteries
                in the UAE. Over the years, we grew, refined
                our sourcing, deepened our farm
                relationships, and rebuilt the brand around
                a single idea: that great coffee deserves to
                be understood, not just consumed. We are
                Emirati-owned, Dubai-roasted, and
                genuinely proud of both.
              </p>
            </div>
            <div
              className={styles.Explore}
              onClick={() => {
                document
                  .getElementById("philosophy")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <h4>Explore About Us</h4>
              <svg
                width="30"
                height="30"
                viewBox="0 0 30 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="0.5" y="0.5" width="29" height="29" stroke="white" />
                <path
                  d="M21 9H19V17.59L9.41 8L8 9.41L17.59 19H9V21H21V9Z"
                  fill="white"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Landing;