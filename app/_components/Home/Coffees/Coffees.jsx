"use client";
import React, { useCallback, useState, useEffect } from "react";
import styles from "./Coffees.module.css";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { useRouter } from "next/navigation";
import axiosClient from "@/lib/axios";
import { formatImageUrl } from "@/lib/imageUtils";

const Coffees = ({ category }) => {
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    containScroll: "trimSnaps",
  });
  useEffect(() => {
    async function fetchProducts() {
      if (!category?.slug) return;
      setIsLoading(true);
      try {
        const productFields = [
          "id",
          "name",
          "slug",
          "description",
          "tagline",
          "productImage",
          "createdAt",
          "tastingNotes",
          "regularPrice",
          "salePrice",
          "isLatest",
          "isBestseller",
        ];
        const productSelectQuery = productFields
          .map((f) => `select[${f}]=true`)
          .join("&");

        const res = await axiosClient.get(
          `/api/web-products?where[categories.slug][equals]=${category.slug}&limit=5&${productSelectQuery}`,
        );
        setProducts(res.data.docs || []);
      } catch (err) {
        console.error("Error fetching products for Coffees carousel:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, [category]);

  // console.log(products);

  useEffect(() => {
    if (!emblaApi) return;

    const updateButtons = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    updateButtons();

    emblaApi.on("select", updateButtons);
    emblaApi.on("reInit", updateButtons);

    return () => {
      emblaApi.off("select", updateButtons);
      emblaApi.off("reInit", updateButtons);
    };
  }, [emblaApi, products]); // Re-init embla when products load

  const scrollPrev = useCallback(() => {
    if (!emblaApi || !canScrollPrev) return;
    emblaApi.scrollPrev();
  }, [emblaApi, canScrollPrev]);

  const scrollNext = useCallback(() => {
    if (!emblaApi || !canScrollNext) return;
    emblaApi.scrollNext();
  }, [emblaApi, canScrollNext]);

  if (isLoading && products.length === 0) {
    return (
      <div className={styles.Main}>
        <div
          className={styles.MainContainer}
          style={{
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
          }}
        >
          <Image
            src="/White-mantis-green-loader.gif"
            alt="Loading products"
            width={120}
            height={120}
            unoptimized
          />
        </div>
      </div>
    );
  }

  if (!isLoading && products.length === 0) {
    return null; // Or show nothing if no products
  }

  return (
    <div className={styles.Main}>
      <div className={styles.MainContainer}>
        <div className={styles.Left}>
          <div className={styles.LeftTop}>
            <h3>{category?.title || "Selected coffees"}</h3>
            <p>
              The White Mantis coffee experience, delivered seamlessly to your
              door. Subscribe for a never-ending supply of excellence.
            </p>
          </div>

          <div className={styles.LeftBottom}>
            <svg
              onClick={scrollPrev}
              style={{
                opacity: canScrollPrev ? 1 : 0.4,
                cursor: canScrollPrev ? "pointer" : "not-allowed",
              }}
              width="47"
              height="47"
              viewBox="0 0 47 47"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="23.0469" cy="23.0469" r="23.0469" fill="#6C7A5F" />
              <path
                d="M27.9023 32.7578L18.1914 23.0469L27.9023 13.3359"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <svg
              onClick={scrollNext}
              style={{
                opacity: canScrollNext ? 1 : 0.4,
                cursor: canScrollNext ? "pointer" : "not-allowed",
              }}
              width="47"
              height="47"
              viewBox="0 0 47 47"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="23.0469" cy="23.0469" r="23.0469" fill="#6C7A5F" />
              <path
                d="M18.1914 13.3359L27.9023 23.0469L18.1914 32.7578"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className={styles.Right}>
          <div className={styles.Embla} ref={emblaRef}>
            <div
              className={styles.EmblaContainer}
              style={{ cursor: "pointer" }}
            >
              {products.map((item, index) => (
                <div
                  onClick={() =>
                    router.push(`/shop/${category.slug}/${item.slug}`)
                  }
                  className={styles.EmblaSlide}
                  key={`coffee-${item.id}`}
                >
                  <div className={styles.Card}>
                    <div className={styles.CardTop}>
                      {(item.isBestseller || item.isLatest) && (
                        <div className={styles.CoffeeBadges}>
                          {item.isLatest && (
                            <div className={styles.NewArrivalBadge}>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6.62806 5.08295L5.89235 2.30213C5.7856 1.89943 5.2144 1.89922 5.10765 2.30192L4.37194 5.08295C4.35363 5.1523 4.31727 5.21556 4.26657 5.2663C4.21587 5.31703 4.15264 5.35343 4.0833 5.3718L1.30203 6.1075C0.899323 6.21425 0.899323 6.78565 1.30203 6.89239L4.08289 7.6281C4.15223 7.64641 4.21549 7.68277 4.26623 7.73347C4.31696 7.78417 4.35337 7.8474 4.37173 7.91673L5.10744 10.698C5.21419 11.1007 5.7856 11.1007 5.89235 10.698L6.62806 7.91694C6.64637 7.84759 6.68273 7.78434 6.73343 7.7336C6.78413 7.68287 6.84736 7.64646 6.9167 7.6281L9.69797 6.89219C10.1007 6.78544 10.1007 6.21404 9.69797 6.10729L6.91691 5.37159C6.84756 5.35327 6.7843 5.31692 6.73356 5.26622C6.68283 5.21552 6.64642 5.15229 6.62806 5.08295Z" fill="white" stroke="white" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span>New arrival</span>
                            </div>
                          )}
                          {item.isBestseller && (
                            <div className={styles.BestsellerBadge}>
                              <svg width="8" height="16" viewBox="0 0 8 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.91 2.2651L6.2825 6.14939L2.12625 6.51216L5.285 9.29044L4.34 13.3871L7.91 11.2193V12.2457L3.0275 15.2186L4.305 9.60012L0 5.81316L5.67875 5.30882L7.91 0V2.2651Z" fill="white"/>
                              </svg>
                              <span>Bestseller</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className={styles.LinkSvg}>
                        <svg
                          width="30"
                          height="30"
                          viewBox="0 0 30 30"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <rect
                            x="0.5"
                            y="-0.5"
                            width="29"
                            height="29"
                            transform="matrix(1 0 0 -1 0 29)"
                            stroke="#6C7A5F"
                          />
                          <path
                            d="M21.0029 20.2479H19.0039V11.5562L9.41838 21.2598L8.00904 19.8331L17.5945 10.1295H9.00857V8.10583H21.0029V20.2479Z"
                            fill="#6C7A5F"
                          />
                        </svg>
                      </div>

                      <div className={styles.ProductImage}>
                        <Image
                          src={formatImageUrl(item.productImage)}
                          alt={item.name}
                          width={300}
                          height={300}
                        />
                      </div>
                    </div>

                    <div className={styles.CardBottom}>
                      <div className={styles.NameAndPriceContainer}>
                        <h3>
                          {item.name} {item.tagline}
                        </h3>

                        {(item.salePrice || item.regularPrice) && (
                          <p className={styles.price}>
                            AED {item.salePrice ? <span>{item.salePrice}</span> : <span>{item.regularPrice}</span>}
                          </p>
                        )}
                      </div>
                      <p>{item.tastingNotes}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.MobileArrows}>
          <svg
            onClick={scrollPrev}
            style={{
              opacity: canScrollPrev ? 1 : 0.4,
              cursor: canScrollPrev ? "pointer" : "not-allowed",
            }}
            width="47"
            height="47"
            viewBox="0 0 47 47"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="23.0469" cy="23.0469" r="23.0469" fill="#6C7A5F" />
            <path
              d="M27.9023 32.7578L18.1914 23.0469L27.9023 13.3359"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <svg
            onClick={scrollNext}
            style={{
              opacity: canScrollNext ? 1 : 0.4,
              cursor: canScrollNext ? "pointer" : "not-allowed",
            }}
            width="47"
            height="47"
            viewBox="0 0 47 47"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="23.0469" cy="23.0469" r="23.0469" fill="#6C7A5F" />
            <path
              d="M18.1914 13.3359L27.9023 23.0469L18.1914 32.7578"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Coffees;
