"use client";
import React, { useEffect, useState } from "react";
import styles from "./ExperienceHighlights.module.css";
import axiosClient from "@/lib/axios";

const ExperienceHighlights = () => {
  const [experience, setExperience] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    axiosClient
      .get("/api/coffee-experience?where[isActive][equals]=true&limit=1")
      .then((res) => {
        const doc = Array.isArray(res.data?.docs) ? res.data.docs[0] : null;
        if (!cancelled) setExperience(doc || null);
      })
      .catch((e) => console.error("ExperienceHighlights load error", e))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !experience) return null;

  const wye = experience.whatYoullExperience || {};
  const esd = experience.everySessionIsDifferent || {};
  const points = wye.points || [];

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "";
  let imgSrc = esd.image?.url || "";
  if (typeof imgSrc === "string" && imgSrc.startsWith("/")) {
    imgSrc = `${serverUrl}${imgSrc}`;
  }

  return (
    <div className={styles.main}>
      <div className={styles.MainContainer}>
        <div className={styles.Left}>
          <div className={styles.TextBlock}>
            <h3 className={styles.Heading}>What You&apos;ll Experience</h3>
            {wye.description && <p className={styles.Description}>{wye.description}</p>}
          </div>

          {points.length > 0 && (
            <div className={styles.PointsCard}>
              {points.map((pt, i) => (
                <React.Fragment key={pt.id || i}>
                  <div className={styles.PointBlock}>
                    <p className={styles.PointTitle}>{pt.title}</p>
                    <p className={styles.PointDescription}>{pt.description}</p>
                  </div>
                  {i < points.length - 1 && <div className={styles.PointDivider}></div>}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        <div className={styles.Right}>
          <div className={styles.TextBlock}>
            <h3 className={styles.Heading}>Every Session Is Different</h3>
            {esd.description && <p className={styles.Description}>{esd.description}</p>}
          </div>
          {imgSrc && (
            <div className={styles.ImageWrap}>
              <img src={imgSrc} alt="" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExperienceHighlights;
