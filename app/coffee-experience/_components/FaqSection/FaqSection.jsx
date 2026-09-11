"use client";
import React, { useEffect, useState } from "react";
import styles from "./FaqSection.module.css";
import axiosClient from "@/lib/axios";

const PlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <mask id="mask0_ce_faq" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
      <rect width="24" height="24" fill="#D9D9D9" />
    </mask>
    <g mask="url(#mask0_ce_faq)">
      <path d="M11 21V13H3V11H11V3H13V11H21V13H13V21H11Z" fill="#6E736A" />
    </g>
  </svg>
);
const MinusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <rect x="0" y="8" width="18" height="2" fill="#525252" />
  </svg>
);

export default function FaqSection() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    axiosClient
      .get("/api/coffee-experience?where[isActive][equals]=true&limit=1")
      .then((res) => {
        const doc = Array.isArray(res.data?.docs) ? res.data.docs[0] : null;
        if (!cancelled) setFaqs(doc?.faqs || []);
      })
      .catch((e) => console.error("FaqSection load error", e))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (index) => setOpenIndex((prev) => (prev === index ? null : index));

  if (loading || faqs.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.bgWrap} />

      <div className={styles.center}>
        <div className={styles.card}>
          <div className={styles.heading}>
            <h3>FREQUENTLY ASKED QUESTIONS</h3>
          </div>

          <div className={styles.list}>
            {faqs.map((item, i) => {
              const isOpen = openIndex === i;
              return (
                <div className={styles.row} key={item.id || i}>
                  <div className={styles.index}>{String(i + 1).padStart(2, "0")}</div>

                  <div className={styles.content}>
                    <div className={styles.top} onClick={() => toggle(i)}>
                      <div className={styles.question}>
                        <span className={styles.qtext}>{item.question}</span>
                      </div>

                      <div className={styles.iconBtn}>{isOpen ? <MinusIcon /> : <PlusIcon />}</div>
                    </div>

                    <div className={`${styles.answer} ${isOpen ? styles.open : ""}`}>
                      <p>{item.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
