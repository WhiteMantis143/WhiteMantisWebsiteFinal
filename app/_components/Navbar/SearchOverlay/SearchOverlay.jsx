"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./SearchOverlay.module.css";
import axiosClient from "@/lib/axios";
import { formatImageUrl } from "@/lib/imageUtils";

export const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <mask id="wm-search-mask" fill="white">
      <path d="M7.43988 0C6.24269 5.57823e-06 5.06319 0.288916 4.00153 0.842199C2.93986 1.39548 2.0274 2.19679 1.34161 3.17809C0.65583 4.15939 0.216982 5.29169 0.0623351 6.47884C-0.0923119 7.66599 0.0418097 8.87293 0.453312 9.99717C0.864813 11.1214 1.54154 12.1297 2.42603 12.9365C3.31052 13.7433 4.37664 14.3248 5.53387 14.6315C6.6911 14.9382 7.90526 14.9611 9.07323 14.6983C10.2412 14.4355 11.3285 13.8947 12.2428 13.1218C12.2208 13.3928 12.3128 13.6718 12.5208 13.8788L16.3608 17.7188C16.5408 17.8988 16.7851 18 17.0398 18C17.2944 18 17.5387 17.8988 17.7188 17.7188C17.8988 17.5387 18 17.2944 18 17.0398C18 16.7851 17.8988 16.5408 17.7188 16.3608L13.8788 12.5208C13.7803 12.4224 13.6616 12.3465 13.5309 12.2985C13.4002 12.2505 13.2606 12.2315 13.1218 12.2428C14.0376 11.1595 14.6245 9.83695 14.8135 8.43107C15.0025 7.02519 14.7856 5.59459 14.1884 4.30789C13.5913 3.02119 12.6387 1.93202 11.443 1.16877C10.2474 0.405517 8.8584 -5.58693e-06 7.43988 0ZM1.43995 7.4399C1.43995 6.65198 1.59514 5.87177 1.89667 5.14383C2.19819 4.41588 2.64014 3.75446 3.19729 3.19731C3.75443 2.64017 4.41586 2.19822 5.1438 1.8967C5.87175 1.59517 6.65195 1.43998 7.43988 1.43998C8.2278 1.43998 9.008 1.59517 9.73595 1.8967C10.4639 2.19822 11.1253 2.64017 11.6825 3.19731C12.2396 3.75446 12.6816 4.41588 12.9831 5.14383C13.2846 5.87177 13.4398 6.65198 13.4398 7.4399C13.4398 9.03117 12.8077 10.5573 11.6825 11.6825C10.5573 12.8077 9.03116 13.4398 7.43988 13.4398C5.8486 13.4398 4.32249 12.8077 3.19729 11.6825C2.07208 10.5573 1.43995 9.03117 1.43995 7.4399Z" />
    </mask>
    <path
      d="M7.43988 0C6.24269 5.57823e-06 5.06319 0.288916 4.00153 0.842199C2.93986 1.39548 2.0274 2.19679 1.34161 3.17809C0.65583 4.15939 0.216982 5.29169 0.0623351 6.47884C-0.0923119 7.66599 0.0418097 8.87293 0.453312 9.99717C0.864813 11.1214 1.54154 12.1297 2.42603 12.9365C3.31052 13.7433 4.37664 14.3248 5.53387 14.6315C6.6911 14.9382 7.90526 14.9611 9.07323 14.6983C10.2412 14.4355 11.3285 13.8947 12.2428 13.1218C12.2208 13.3928 12.3128 13.6718 12.5208 13.8788L16.3608 17.7188C16.5408 17.8988 16.7851 18 17.0398 18C17.2944 18 17.5387 17.8988 17.7188 17.7188C17.8988 17.5387 18 17.2944 18 17.0398C18 16.7851 17.8988 16.5408 17.7188 16.3608L13.8788 12.5208C13.7803 12.4224 13.6616 12.3465 13.5309 12.2985C13.4002 12.2505 13.2606 12.2315 13.1218 12.2428C14.0376 11.1595 14.6245 9.83695 14.8135 8.43107C15.0025 7.02519 14.7856 5.59459 14.1884 4.30789C13.5913 3.02119 12.6387 1.93202 11.443 1.16877C10.2474 0.405517 8.8584 -5.58693e-06 7.43988 0ZM1.43995 7.4399C1.43995 6.65198 1.59514 5.87177 1.89667 5.14383C2.19819 4.41588 2.64014 3.75446 3.19729 3.19731C3.75443 2.64017 4.41586 2.19822 5.1438 1.8967C5.87175 1.59517 6.65195 1.43998 7.43988 1.43998C8.2278 1.43998 9.008 1.59517 9.73595 1.8967C10.4639 2.19822 11.1253 2.64017 11.6825 3.19731C12.2396 3.75446 12.6816 4.41588 12.9831 5.14383C13.2846 5.87177 13.4398 6.65198 13.4398 7.4399C13.4398 9.03117 12.8077 10.5573 11.6825 11.6825C10.5573 12.8077 9.03116 13.4398 7.43988 13.4398C5.8486 13.4398 4.32249 12.8077 3.19729 11.6825C2.07208 10.5573 1.43995 9.03117 1.43995 7.4399Z"
      fill="#6E736A"
      mask="url(#wm-search-mask)"
    />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M1.6 16L0 14.4L6.4 8L0 1.6L1.6 0L8 6.4L14.4 0L16 1.6L9.6 8L16 14.4L14.4 16L8 9.6L1.6 16Z"
      fill="#2F362A"
    />
  </svg>
);

const DEBOUNCE_MS = 350;

function ResultCard({ href, image, title, description, onNavigate }) {
  return (
    <Link href={href} className={styles.resultCard} onClick={onNavigate}>
      <div className={styles.resultImageWrapper}>
        {image && (
          <Image
            src={image}
            alt={title}
            width={90}
            height={90}
            className={styles.resultImage}
            unoptimized
          />
        )}
      </div>
      <div className={styles.resultContent}>
        <h4 className={styles.resultTitle}>{title}</h4>
        {description && <p className={styles.resultDesc}>{description}</p>}
      </div>
    </Link>
  );
}

function ResultSection({ title, children }) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionLabel}>{title}</p>
      <div className={styles.cardList}>{children}</div>
    </div>
  );
}

export default function SearchOverlay({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [academyItems, setAcademyItems] = useState([]);
  const [coffeeExperience, setCoffeeExperience] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);

  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const coffeeExperienceRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) {
      setProducts([]);
      setBlogs([]);
      setAcademyItems([]);
      setCoffeeExperience(null);
      return;
    }
    runSearch(debouncedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const getCoffeeExperience = async () => {
    if (coffeeExperienceRef.current) return coffeeExperienceRef.current;
    try {
      const res = await axiosClient.get(
        "/api/coffee-experience?where[isActive][equals]=true&limit=1",
      );
      const doc = res.data?.docs?.[0] || null;
      coffeeExperienceRef.current = doc;
      return doc;
    } catch (err) {
      console.error("Error fetching coffee experience for search:", err);
      return null;
    }
  };

  const runSearch = async (q) => {
    setLoadingResults(true);
    try {
      const [productsRes, blogsRes, academyRes, experience] = await Promise.allSettled([
        axiosClient.get("/api/web-products", {
          params: {
            "where[name][like]": q,
            limit: 10,
            depth: 1,
          },
        }),
        axiosClient.get("/api/blogs", {
          params: {
            "where[title][like]": q,
            limit: 10,
          },
        }),
        axiosClient.get("/api/workshop", {
          params: {
            "where[title][like]": q,
            limit: 10,
          },
        }),
        getCoffeeExperience(),
      ]);

      setProducts(
        productsRes.status === "fulfilled" ? productsRes.value.data?.docs || [] : [],
      );
      setBlogs(blogsRes.status === "fulfilled" ? blogsRes.value.data?.docs || [] : []);
      setAcademyItems(
        academyRes.status === "fulfilled" ? academyRes.value.data?.docs || [] : [],
      );

      const lowerQ = q.toLowerCase();
      const experienceDoc = experience.status === "fulfilled" ? experience.value : null;
      const matchesExperience =
        experienceDoc &&
        (experienceDoc.title?.toLowerCase().includes(lowerQ) ||
          experienceDoc.shortDescription?.toLowerCase().includes(lowerQ));
      setCoffeeExperience(matchesExperience ? experienceDoc : null);
    } catch (err) {
      console.error("Error running site search:", err);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleClose = () => onClose();

  const isSearching = debouncedQuery.length > 0;
  const noResults =
    isSearching &&
    !loadingResults &&
    products.length === 0 &&
    blogs.length === 0 &&
    academyItems.length === 0 &&
    !coffeeExperience;

  return (
    <div
      ref={panelRef}
      className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}
    >
      <div className={styles.searchRow}>
        <SearchIcon />
        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          placeholder="Search products, blogs, academy & more"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          className={styles.closeBtn}
          onClick={handleClose}
          aria-label="Close search"
        >
          <CloseIcon />
        </button>
      </div>

      <div className={styles.divider} />

      <div className={styles.resultsScroll}>
        {!isSearching ? (
          <div className={styles.stateMsg}>Start typing to search White Mantis</div>
        ) : loadingResults ? (
          <div className={styles.stateMsg}>Searching...</div>
        ) : noResults ? (
          <div className={styles.emptyState}>
            <p>No results found</p>
          </div>
        ) : (
          <>
            {products.length > 0 && (
              <ResultSection title="Products">
                {products.map((item) => (
                  <ResultCard
                    key={item.id}
                    href={`/shop/${item.categories?.slug || "all"}/${item.slug}`}
                    image={item.productImage ? formatImageUrl(item.productImage) : null}
                    title={item.name}
                    description={item.description}
                    onNavigate={handleClose}
                  />
                ))}
              </ResultSection>
            )}

            {blogs.length > 0 && (
              <ResultSection title="Blogs">
                {blogs.map((item) => (
                  <ResultCard
                    key={item.id}
                    href={`/blogs/${item.slug}`}
                    image={item.featuredImage ? formatImageUrl(item.featuredImage) : null}
                    title={item.title}
                    description={item.shortDescription}
                    onNavigate={handleClose}
                  />
                ))}
              </ResultSection>
            )}

            {academyItems.length > 0 && (
              <ResultSection title="Academy & Events">
                {academyItems.map((item) => (
                  <ResultCard
                    key={item.id}
                    href="/academy"
                    image={item.workshopImage ? formatImageUrl(item.workshopImage) : null}
                    title={item.title}
                    description={item.workshopDescription}
                    onNavigate={handleClose}
                  />
                ))}
              </ResultSection>
            )}

            {coffeeExperience && (
              <ResultSection title="Coffee Experience">
                <ResultCard
                  key={coffeeExperience.id}
                  href="/coffee-experience"
                  image={
                    coffeeExperience.heroImage
                      ? formatImageUrl(coffeeExperience.heroImage)
                      : null
                  }
                  title={coffeeExperience.title}
                  description={coffeeExperience.shortDescription}
                  onNavigate={handleClose}
                />
              </ResultSection>
            )}
          </>
        )}
      </div>
    </div>
  );
}
