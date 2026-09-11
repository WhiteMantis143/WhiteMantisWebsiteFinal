"use client";
import React, { useEffect, useState } from "react";
import axiosClient from "@/lib/axios";
import EmptyState from "./EmptyState/EmptyState";

// Decides once, at the page level, whether an active Coffee Experience
// exists — so a fully-empty collection shows one cohesive page-wide empty
// state instead of each section independently guessing (a blank hero, a
// missing calendar, etc). The individual sections still each fetch and
// null-guard their own data too, purely as a defensive fallback for the
// rare race where the experience gets deactivated between this check and
// theirs.
const CoffeeExperienceGate = ({ children }) => {
  const [status, setStatus] = useState("loading"); // 'loading' | 'empty' | 'ready'

  useEffect(() => {
    let cancelled = false;
    axiosClient
      .get("/api/coffee-experience?where[isActive][equals]=true&limit=1")
      .then((res) => {
        const doc = Array.isArray(res.data?.docs) ? res.data.docs[0] : null;
        if (!cancelled) setStatus(doc ? "ready" : "empty");
      })
      .catch((e) => {
        console.error("CoffeeExperienceGate load error", e);
        if (!cancelled) setStatus("empty");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") return null;
  if (status === "empty") return <EmptyState />;
  return <>{children}</>;
};

export default CoffeeExperienceGate;
