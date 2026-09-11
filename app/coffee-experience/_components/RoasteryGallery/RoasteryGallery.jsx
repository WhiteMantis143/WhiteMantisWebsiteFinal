"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./RoasteryGallery.module.css";
import axiosClient from "@/lib/axios";

const RoasteryGallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollerRef = useRef(null);
  const dragState = useRef({ isDown: false, startX: 0, startScrollLeft: 0, moved: false });
  const [isDragging, setIsDragging] = useState(false);

  // overflow-x:auto only responds to a trackpad/scrollbar/touch swipe out of
  // the box — desktop mouse users expect to click-and-drag the images
  // directly, same as most gallery/carousel UIs. Translate mouse movement
  // into scrollLeft manually for that case; touch devices already work fine
  // natively and are untouched by this.
  const onMouseDown = (e) => {
    const el = scrollerRef.current;
    if (!el) return;
    dragState.current = {
      isDown: true,
      startX: e.pageX,
      startScrollLeft: el.scrollLeft,
      moved: false,
    };
    setIsDragging(true);
  };

  const onMouseMove = (e) => {
    const el = scrollerRef.current;
    const state = dragState.current;
    if (!state.isDown || !el) return;
    const delta = e.pageX - state.startX;
    if (Math.abs(delta) > 3) state.moved = true;
    el.scrollLeft = state.startScrollLeft - delta;
  };

  const endDrag = () => {
    dragState.current.isDown = false;
    setIsDragging(false);
  };

  // Dragging over an <img> normally starts the browser's native "ghost
  // image" drag — suppress it so it doesn't fight with our own scroll drag.
  const onDragStart = (e) => {
    if (dragState.current.isDown) e.preventDefault();
  };

  // If the mouse only moved a few px (a click, not a drag), let the click
  // through normally instead of swallowing it.
  const onClickCapture = (e) => {
    if (dragState.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  useEffect(() => {
    let cancelled = false;
    axiosClient
      .get("/api/coffee-experience?where[isActive][equals]=true&limit=1")
      .then((res) => {
        const doc = Array.isArray(res.data?.docs) ? res.data.docs[0] : null;
        if (!cancelled) setImages(doc?.fromTheRoastery || []);
      })
      .catch((e) => console.error("RoasteryGallery load error", e))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || images.length === 0) return null;

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "";

  return (
    <div className={styles.main}>
      <div
        className={`${styles.Scroller} ${isDragging ? styles.Dragging : ""}`}
        ref={scrollerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onClickCapture={onClickCapture}
      >
        {images.map((img, i) => {
          let src = img?.url || "";
          if (typeof src === "string" && src.startsWith("/")) {
            src = `${serverUrl}${src}`;
          }
          return (
            <div className={styles.ImageWrap} key={img.id || i}>
              {src && <img src={src} alt="" draggable={false} onDragStart={onDragStart} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoasteryGallery;
