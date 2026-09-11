"use client";
import React, { useEffect, useState } from "react";
import styles from "./Landing.module.css";
import axiosClient from "@/lib/axios";

const Landing = () => {
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await axiosClient.get(
          "/api/coffee-experience?where[isActive][equals]=true&limit=1",
        );
        const doc = Array.isArray(res.data?.docs) ? res.data.docs[0] : null;
        if (!cancelled) setExperience(doc || null);
      } catch (e) {
        console.error("Coffee Experience Landing load error", e);
        if (!cancelled) setHasError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "";
  let imgSrc = experience?.heroImage?.url || "";
  if (typeof imgSrc === "string" && imgSrc.startsWith("/")) {
    imgSrc = `${serverUrl}${imgSrc}`;
  }

  if (!loading && !hasError && !experience) {
    return (
      <div className={styles.main}>
        <div className={styles.EmptyState}>
          <p>There isn&apos;t a Coffee Experience running right now — check back soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.main}>
      <div className={styles.MainContainer}>
        <div className={styles.ImageSide}>
          {imgSrc && (
            <img src={imgSrc} alt={experience?.title || "Coffee Experience"} />
          )}
        </div>
        <div className={styles.ContentSide}>
          <div className={styles.ContentInner}>
            <p className={styles.Eyebrow}>Monthly Experience - White Mantis Roastery</p>
            <div className={styles.HeadingGroup}>
              <h1 className={styles.Heading}>The Coffee Tasting Experience</h1>
              <div className={styles.DividerGroup}>
                <div className={styles.DividerLine}></div>
                {experience?.title && (
                  <h2 className={styles.Title}>{experience.title}</h2>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
