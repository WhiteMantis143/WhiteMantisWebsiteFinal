"use client";
import React, { useEffect, useState } from "react";
import styles from "./WhoIsItFor.module.css";
import axiosClient from "@/lib/axios";

const ICON_SRC = {
  coffee: "/coffee-experience-icons/coffee.svg",
  leaf: "/coffee-experience-icons/leaf.svg",
  people: "/coffee-experience-icons/people.svg",
  gift: "/coffee-experience-icons/gift.svg",
  sparkle: "/coffee-experience-icons/sparkle.svg",
};

const WhoIsItFor = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    axiosClient
      .get("/api/coffee-experience?where[isActive][equals]=true&limit=1")
      .then((res) => {
        const doc = Array.isArray(res.data?.docs) ? res.data.docs[0] : null;
        if (!cancelled) setItems(doc?.whoIsItFor || []);
      })
      .catch((e) => console.error("WhoIsItFor load error", e))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <div className={styles.main}>
      <div className={styles.MainContainer}>
        <h3 className={styles.Heading}>Who Is It For?</h3>
        <div className={styles.Grid}>
          {items.map((item, i) => (
            <div className={styles.GridItem} key={item.id || i}>
              {ICON_SRC[item.icon] && (
                <img className={styles.Icon} src={ICON_SRC[item.icon]} alt="" />
              )}
              <p className={styles.ItemText}>{item.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WhoIsItFor;
