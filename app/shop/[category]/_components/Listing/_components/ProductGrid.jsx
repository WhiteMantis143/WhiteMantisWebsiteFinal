import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import AddToCart from "@/app/_components/AddToCart";
import Wishlist from "@/app/_components/Whishlist";
import BuyNowPopup from "./BuyNowPopup/BuyNowPopup";
import prodZero from "./BuyNowPopup/prodZero.gif";
const ProductGrid = ({
  filteredProducts,
  visibleCount,
  handleLoadMore,
  getDisplayData,
  handleOpenSubscribePopup,
  categorySlug,
  currentCategory,
  sortType,
  setSortType,
  sortOpen,
  setSortOpen,
  setIsMobileFiltersOpen,
  resetFilters,
  handleOpenCartPopup,
  styles,
}) => {
  const [activeMobileCard, setActiveMobileCard] = useState(null);
  const sortRef = useRef(null);

  useEffect(() => {
    if (!sortOpen) return;
    function handleClickOutside(e) {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sortOpen]);

  return (
    <div className={styles.RightConatiner}>
      <div className={styles.RightTop}>
        <div className={styles.RightTopLeft}>
          <div className={styles.CatName}>
            <h3>{currentCategory?.title || "Shop"}</h3>
          </div>
          <div className={styles.CatCount}>
            <p>({filteredProducts.length} items)</p>
          </div>
        </div>

        <div className={styles.RightTopRight}>
          <button
            className={styles.MobileFilterBtn}
            onClick={() => setIsMobileFiltersOpen(true)}
          >
            <svg
              width="12"
              height="8"
              viewBox="0 0 12 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.66667 8V6.66667H7.33333V8H4.66667ZM2 4.66667V3.33333H10V4.66667H2ZM0 1.33333V0H12V1.33333H0Z"
                fill="#6E736A"
              />
            </svg>
            Filter
          </button>

          <div className={styles.SortBy}>
            <p>Sort by:</p>
          </div>
          <div className={styles.SortWrapper} ref={sortRef}>
            <div
              className={styles.SortOptions}
              onClick={() => setSortOpen(!sortOpen)}
            >
              <p>{sortType}</p>
              <span
                className={`${styles.SortArrow} ${sortOpen ? styles.SortArrowOpen : ""
                  }`}
              >
                <svg
                  width="13"
                  height="7"
                  viewBox="0 0 13 7"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    /* Path rewritten to point UP */
                    d="M6.0625 0L12.1247 6.75H0.000322342L6.0625 0Z"
                    fill="#2F362A"
                  />
                </svg>
              </span>
            </div>
            {sortOpen && (
              <div className={styles.SortDropdown}>
                {["Recommended", "Latest to Oldest", "Oldest to Latest"].map(
                  (item) => (
                    <p
                      key={item}
                      onClick={() => {
                        setSortType(item);
                        setSortOpen(false);
                      }}
                    >
                      {item}
                    </p>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={styles.RightBottom}>
        {filteredProducts.length === 0 ? (
          /* --- ZERO STATE OUTSIDE GRID --- */
          <div className={styles.NoProducts}>
            <Image src={prodZero} alt="No products" width={150} height={150} />
            <div className={styles.NoProductsP}>
              <p style={{ color: "black", fontFamily: "var(--lexend)" }}>Nothing brewing here</p>
              <p>Refine or clear filters to explore available selections.</p>
            </div>
            <button className={styles.zeroButton} onClick={resetFilters}>
              Reset Filters
            </button>
          </div>
        ) : (
          /* --- REGULAR CONTENT --- */
          <>
            <div className={styles.ProductsGrid}>
              {filteredProducts.slice(0, visibleCount).map((product) => {
                const displayData = getDisplayData(product);
                const cartProduct = {
                  productId: product.id,
                  variationId: product.hasVariantOptions
                    ? product.variants?.[0]?.id
                    : null,
                  quantity: 1,
                };
                const productUrl = `/shop/${categorySlug}/${product.slug}`;
                const isOutOfStock = product.hasVariantOptions
                  ? !product.variants?.some((v) => v.variantInStock)
                  : product.inStock === false;
                const stockQuantity = product.hasVariantOptions
                  ? product.variants?.[0]?.variantStockQuantity
                  : product.stockQuantity;
                const isLowStock =
                  !isOutOfStock && stockQuantity > 0 && stockQuantity <= 10;
                return (
                  <div
                    className={`${styles.ProductCard} ${activeMobileCard && activeMobileCard !== product.id
                      ? styles.CardBlurred
                      : ""
                      }`}
                    key={product.id}
                  >
                    <div className={styles.ProductTop}>
                      {(product.isBestseller || product.isLatest) && (
                        <div className={styles.ProductBadges}>
                          {product.isLatest && (
                            <div className={styles.NewArrivalBadge}>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6.62806 5.08295L5.89235 2.30213C5.7856 1.89943 5.2144 1.89922 5.10765 2.30192L4.37194 5.08295C4.35363 5.1523 4.31727 5.21556 4.26657 5.2663C4.21587 5.31703 4.15264 5.35343 4.0833 5.3718L1.30203 6.1075C0.899323 6.21425 0.899323 6.78565 1.30203 6.89239L4.08289 7.6281C4.15223 7.64641 4.21549 7.68277 4.26623 7.73347C4.31696 7.78417 4.35337 7.8474 4.37173 7.91673L5.10744 10.698C5.21419 11.1007 5.7856 11.1007 5.89235 10.698L6.62806 7.91694C6.64637 7.84759 6.68273 7.78434 6.73343 7.7336C6.78413 7.68287 6.84736 7.64646 6.9167 7.6281L9.69797 6.89219C10.1007 6.78544 10.1007 6.21404 9.69797 6.10729L6.91691 5.37159C6.84756 5.35327 6.7843 5.31692 6.73356 5.26622C6.68283 5.21552 6.64642 5.15229 6.62806 5.08295Z" fill="white" stroke="white" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span>New arrival</span>
                            </div>
                          )}
                          {product.isBestseller && (
                            <div className={styles.BestsellerBadge}>
                              <svg width="8" height="16" viewBox="0 0 8 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.91 2.2651L6.2825 6.14939L2.12625 6.51216L5.285 9.29044L4.34 13.3871L7.91 11.2193V12.2457L3.0275 15.2186L4.305 9.60012L0 5.81316L5.67875 5.30882L7.91 0V2.2651Z" fill="white"/>
                              </svg>
                              <span>Bestseller</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className={styles.WishlistIcon}>
                        <Wishlist product={product} />
                      </div>
                      <Link
                        href={productUrl}
                        className={`${styles.ProductImage} ${isOutOfStock ? styles.Muted : ""}`}
                      >
                        {displayData.image ? (
                          <Image
                            src={displayData.image}
                            alt={product.name}
                            width={300}
                            height={300}
                          />
                        ) : (
                          <div className={styles.NoImage}>No Image</div>
                        )}
                      </Link>
                    </div>
                    <div className={styles.ProductBottom}>
                      <Link
                        href={productUrl}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <div
                          className={`${styles.ProductInfo} ${activeMobileCard === product.id ? styles.CardMiddleBlurred : ""
                            }`}
                        >
                          <div className={styles.ProductPrice}>
                            <div className={styles.PriceGroup}>
                              <h4>AED {displayData.price}</h4>
                              {displayData.sale_price &&
                                displayData.sale_price !==
                                displayData.regular_price && (
                                  <p className={styles.OldPrice}>
                                    AED {displayData.regular_price}
                                  </p>
                                )}
                            </div>
                            {isLowStock && (
                              <div className={styles.LowStockIndicator}>
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <mask id={`clock-mask-${product.id}`} fill="white">
                                    <path d="M7.5 2.25C7.2875 2.25 7.1095 2.178 6.966 2.034C6.8225 1.89 6.7505 1.712 6.75 1.5C6.7495 1.288 6.8215 1.11 6.966 0.966C7.1105 0.822 7.2885 0.75 7.5 0.75H10.5C10.7125 0.75 10.8908 0.822 11.0348 0.966C11.1788 1.11 11.2505 1.288 11.25 1.5C11.2495 1.712 11.1775 1.89025 11.034 2.03475C10.8905 2.17925 10.7125 2.251 10.5 2.25H7.5ZM9.53475 10.2848C9.67825 10.1408 9.75 9.9625 9.75 9.75V6.75C9.75 6.5375 9.678 6.3595 9.534 6.216C9.39 6.0725 9.212 6.0005 9 6C8.788 5.9995 8.61 6.0715 8.466 6.216C8.322 6.3605 8.25 6.5385 8.25 6.75V9.75C8.25 9.9625 8.322 10.1408 8.466 10.2848C8.61 10.4288 8.788 10.5005 9 10.5C9.212 10.4995 9.39025 10.4275 9.53475 10.284M6.38475 15.966C5.56575 15.6095 4.85 15.125 4.2375 14.5125C3.625 13.9 3.14075 13.1843 2.78475 12.3653C2.42875 11.5463 2.2505 10.6745 2.25 9.75C2.2495 8.8255 2.42775 7.9535 2.78475 7.134C3.14175 6.3145 3.626 5.599 4.2375 4.9875C4.849 4.376 5.56475 3.89175 6.38475 3.53475C7.20475 3.17775 8.0765 2.9995 9 3C9.775 3 10.5188 3.125 11.2313 3.375C11.9438 3.625 12.6125 3.9875 13.2375 4.4625L13.7625 3.9375C13.9 3.8 14.075 3.73125 14.2875 3.73125C14.5 3.73125 14.675 3.8 14.8125 3.9375C14.95 4.075 15.0188 4.25 15.0188 4.4625C15.0188 4.675 14.95 4.85 14.8125 4.9875L14.2875 5.5125C14.7625 6.1375 15.125 6.80625 15.375 7.51875C15.625 8.23125 15.75 8.975 15.75 9.75C15.75 10.675 15.5718 11.547 15.2153 12.366C14.8588 13.185 14.3745 13.9005 13.7625 14.5125C13.1505 15.1245 12.4348 15.609 11.6153 15.966C10.7958 16.323 9.924 16.501 9 16.5C8.076 16.499 7.20475 16.321 6.38475 15.966ZM12.7125 13.4625C13.7375 12.4375 14.25 11.2 14.25 9.75C14.25 8.3 13.7375 7.0625 12.7125 6.0375C11.6875 5.0125 10.45 4.5 9 4.5C7.55 4.5 6.3125 5.0125 5.2875 6.0375C4.2625 7.0625 3.75 8.3 3.75 9.75C3.75 11.2 4.2625 12.4375 5.2875 13.4625C6.3125 14.4875 7.55 15 9 15C10.45 15 11.6875 14.4875 12.7125 13.4625Z"/>
                                  </mask>
                                  <path d="M7.5 2.25C7.2875 2.25 7.1095 2.178 6.966 2.034C6.8225 1.89 6.7505 1.712 6.75 1.5C6.7495 1.288 6.8215 1.11 6.966 0.966C7.1105 0.822 7.2885 0.75 7.5 0.75H10.5C10.7125 0.75 10.8908 0.822 11.0348 0.966C11.1788 1.11 11.2505 1.288 11.25 1.5C11.2495 1.712 11.1775 1.89025 11.034 2.03475C10.8905 2.17925 10.7125 2.251 10.5 2.25H7.5ZM9.53475 10.2848C9.67825 10.1408 9.75 9.9625 9.75 9.75V6.75C9.75 6.5375 9.678 6.3595 9.534 6.216C9.39 6.0725 9.212 6.0005 9 6C8.788 5.9995 8.61 6.0715 8.466 6.216C8.322 6.3605 8.25 6.5385 8.25 6.75V9.75C8.25 9.9625 8.322 10.1408 8.466 10.2848C8.61 10.4288 8.788 10.5005 9 10.5C9.212 10.4995 9.39025 10.4275 9.53475 10.284M6.38475 15.966C5.56575 15.6095 4.85 15.125 4.2375 14.5125C3.625 13.9 3.14075 13.1843 2.78475 12.3653C2.42875 11.5463 2.2505 10.6745 2.25 9.75C2.2495 8.8255 2.42775 7.9535 2.78475 7.134C3.14175 6.3145 3.626 5.599 4.2375 4.9875C4.849 4.376 5.56475 3.89175 6.38475 3.53475C7.20475 3.17775 8.0765 2.9995 9 3C9.775 3 10.5188 3.125 11.2313 3.375C11.9438 3.625 12.6125 3.9875 13.2375 4.4625L13.7625 3.9375C13.9 3.8 14.075 3.73125 14.2875 3.73125C14.5 3.73125 14.675 3.8 14.8125 3.9375C14.95 4.075 15.0188 4.25 15.0188 4.4625C15.0188 4.675 14.95 4.85 14.8125 4.9875L14.2875 5.5125C14.7625 6.1375 15.125 6.80625 15.375 7.51875C15.625 8.23125 15.75 8.975 15.75 9.75C15.75 10.675 15.5718 11.547 15.2153 12.366C14.8588 13.185 14.3745 13.9005 13.7625 14.5125C13.1505 15.1245 12.4348 15.609 11.6153 15.966C10.7958 16.323 9.924 16.501 9 16.5C8.076 16.499 7.20475 16.321 6.38475 15.966ZM12.7125 13.4625C13.7375 12.4375 14.25 11.2 14.25 9.75C14.25 8.3 13.7375 7.0625 12.7125 6.0375C11.6875 5.0125 10.45 4.5 9 4.5C7.55 4.5 6.3125 5.0125 5.2875 6.0375C4.2625 7.0625 3.75 8.3 3.75 9.75C3.75 11.2 4.2625 12.4375 5.2875 13.4625C6.3125 14.4875 7.55 15 9 15C10.45 15 11.6875 14.4875 12.7125 13.4625Z" fill="#D0892F"/>
                                  <path d="M7.5 2.25C7.2875 2.25 7.1095 2.178 6.966 2.034C6.8225 1.89 6.7505 1.712 6.75 1.5C6.7495 1.288 6.8215 1.11 6.966 0.966C7.1105 0.822 7.2885 0.75 7.5 0.75H10.5C10.7125 0.75 10.8908 0.822 11.0348 0.966C11.1788 1.11 11.2505 1.288 11.25 1.5C11.2495 1.712 11.1775 1.89025 11.034 2.03475C10.8905 2.17925 10.7125 2.251 10.5 2.25H7.5ZM9.53475 10.2848C9.67825 10.1408 9.75 9.9625 9.75 9.75V6.75C9.75 6.5375 9.678 6.3595 9.534 6.216C9.39 6.0725 9.212 6.0005 9 6C8.788 5.9995 8.61 6.0715 8.466 6.216C8.322 6.3605 8.25 6.5385 8.25 6.75V9.75C8.25 9.9625 8.322 10.1408 8.466 10.2848C8.61 10.4288 8.788 10.5005 9 10.5C9.212 10.4995 9.39025 10.4275 9.53475 10.284M6.38475 15.966C5.56575 15.6095 4.85 15.125 4.2375 14.5125C3.625 13.9 3.14075 13.1843 2.78475 12.3653C2.42875 11.5463 2.2505 10.6745 2.25 9.75C2.2495 8.8255 2.42775 7.9535 2.78475 7.134C3.14175 6.3145 3.626 5.599 4.2375 4.9875C4.849 4.376 5.56475 3.89175 6.38475 3.53475C7.20475 3.17775 8.0765 2.9995 9 3C9.775 3 10.5188 3.125 11.2313 3.375C11.9438 3.625 12.6125 3.9875 13.2375 4.4625L13.7625 3.9375C13.9 3.8 14.075 3.73125 14.2875 3.73125C14.5 3.73125 14.675 3.8 14.8125 3.9375C14.95 4.075 15.0188 4.25 15.0188 4.4625C15.0188 4.675 14.95 4.85 14.8125 4.9875L14.2875 5.5125C14.7625 6.1375 15.125 6.80625 15.375 7.51875C15.625 8.23125 15.75 8.975 15.75 9.75C15.75 10.675 15.5718 11.547 15.2153 12.366C14.8588 13.185 14.3745 13.9005 13.7625 14.5125C13.1505 15.1245 12.4348 15.609 11.6153 15.966C10.7958 16.323 9.924 16.501 9 16.5C8.076 16.499 7.20475 16.321 6.38475 15.966ZM12.7125 13.4625C13.7375 12.4375 14.25 11.2 14.25 9.75C14.25 8.3 13.7375 7.0625 12.7125 6.0375C11.6875 5.0125 10.45 4.5 9 4.5C7.55 4.5 6.3125 5.0125 5.2875 6.0375C4.2625 7.0625 3.75 8.3 3.75 9.75C3.75 11.2 4.2625 12.4375 5.2875 13.4625C6.3125 14.4875 7.55 15 9 15C10.45 15 11.6875 14.4875 12.7125 13.4625Z" fill="#D0892F" mask={`url(#clock-mask-${product.id})`}/>
                                </svg>
                                <span>Only {stockQuantity} left</span>
                              </div>
                            )}
                          </div>
                          <div className={styles.Line}></div>
                          <div className={styles.ProductName}>
                            <h3>{`${product.name} ${product.tagline || ""}`}</h3>
                            <p>{product.tastingNotes}</p>
                          </div>
                        </div>
                      </Link>
                      <div className={styles.ProductActions}>
                        {isOutOfStock ? (
                          <div className={styles.OutOfStockRow}>
                            <button className={styles.OutOfStockBtn} disabled>
                              Out of Stock
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className={styles.DesktopActions}>
                              <button
                                className={styles.AddToCart}
                                onClick={() => handleOpenCartPopup(product)}
                                style={{
                                  width: "100%",
                                  boxSizing: "border-box",
                                  backgroundColor: "#6C7A5F",
                                  color: "#ffffff",
                                  fontSize: "15px",
                                  fontWeight: 500,
                                  border: "none",
                                  padding: "12px 22px",
                                  whiteSpace: "nowrap",
                                  cursor: "pointer",
                                  transition: "background-color 0.2s ease",
                                }}
                                onMouseEnter={(e) => { e.target.style.backgroundColor = "#5f6f57"; }}
                                onMouseLeave={(e) => { e.target.style.backgroundColor = "#6C7A5F"; }}
                              >
                                Add to Cart
                              </button>
                              {/* Subscription CTA temporarily disabled — recurring billing not yet confirmed end-to-end.
                              {(product.hasSimpleSub ||
                                (product.hasVariantOptions &&
                                  product.variants?.some((v) => v.hasVariantSub))) && (
                                  <button
                                    className={styles.Subscribe}
                                    onClick={() => handleOpenSubscribePopup(product)}
                                  >
                                    Subscribe
                                  </button>
                                )}
                              */}
                            </div>

                            <div className={styles.MobileActions}>
                              {isOutOfStock ? (
                                <div className={styles.OutOfStockRow}>
                                  <button className={styles.OutOfStockBtn} disabled>
                                    Out of Stock
                                  </button>
                                </div>
                              ) : (
                                <div
                                  className={`${styles.MobileBuyNowWrapper} ${activeMobileCard === product.id ? styles.MobileBuyNowExpanded : ""}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Frosted overlay — covers title/price on active card */}
                                  <div
                                    className={styles.MobileCardOverlay}
                                    onClick={() => setActiveMobileCard(null)}
                                  />

                                  {/* Subscribe rises up behind Add to Cart — temporarily disabled, see note above.
                                  {(product.hasSimpleSub ||
                                    (product.hasVariantOptions &&
                                      product.variants?.some((v) => v.hasVariantSub))) && (
                                      <button
                                        className={styles.MobileSubscribeRising}
                                        onClick={() => {
                                          setActiveMobileCard(null);
                                          handleOpenSubscribePopup(product);
                                        }}
                                      >
                                        Subscribe
                                      </button>
                                    )}
                                  */}

                                  {/* Primary button — morphs Buy Now → Add to Cart */}
                                  <button
                                    className={styles.MobileBuyNowBtn}
                                    onClick={() => {
                                      if (activeMobileCard === product.id) {
                                        setActiveMobileCard(null);
                                        handleOpenCartPopup(product);
                                      } else {
                                        setActiveMobileCard(product.id);
                                      }
                                    }}
                                  >
                                    {activeMobileCard === product.id ? "Add to Cart" : "Buy Now"}
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {visibleCount < filteredProducts.length && (
              <div className={styles.LoadMore}>
                <button className={styles.LoadMoreCta} onClick={handleLoadMore}>
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {activeMobileCard && (
        <div
          onClick={() => setActiveMobileCard(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
};

export default ProductGrid;
