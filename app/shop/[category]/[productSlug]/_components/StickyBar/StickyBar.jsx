"use client";

import { useRouter } from "next/navigation";
import styles from "./StickyBar.module.css";
import { useCart } from "../../../../../_context/CartContext";
import { useProductImage } from "../../_context/ProductImageContext";
import React, { useState, useEffect, useRef } from "react";
import SubscriptionPopup from "@/app/shop/[category]/_components/Listing/_components/SubscriptionPopup";
import AddToCartPopup from "@/app/_components/AddToCartPopup/AddToCartPopup";

const StickyBar = ({ product }) => {
  const router = useRouter();
  const { addToCart, refresh, items } = useCart();
  const { setSelectedImage, selectedVariant, setSelectedVariant } =
    useProductImage();

  // Helper to get variants sorted by weight
  const getSortedVariants = (item) => {
    if (!item?.variants || item.variants.length === 0) return [];
    return [...item.variants].sort((a, b) => {
      const weightA = parseInt(a.variantName) || 0;
      const weightB = parseInt(b.variantName) || 0;
      return weightA - weightB;
    });
  };

  const sortedVariants = getSortedVariants(product);
  const [selectedWeight, setSelectedWeight] = useState(
    product?.hasVariantOptions ? sortedVariants[0] : null,
  );

  const [qty, setQty] = useState(1);
  const [qtyError, setQtyError] = useState("");
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [showWeightMenu, setShowWeightMenu] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedBagAmountId, setSelectedBagAmountId] = useState(null);

  const [showCartPopup, setShowCartPopup] = useState(false);
  const [selectedSubProduct, setSelectedSubProduct] = useState(null);

  // Initialize selectedHighlights with the first option of each section
  const [selectedHighlights, setSelectedHighlights] = useState(() => {
    const initial = {};
    product?.productHighlights?.forEach((section) => {
      if (section.items?.length > 0) {
        initial[section.sectionTitle] = section.items[0].point;
      }
    });
    return initial;
  });

  const formatHighlightsForPayload = (highlights) => {
    return Object.entries(highlights).map(([title, point]) => ({
      sectionTitle: title,
      items: [{ point }],
    }));
  };

  // Sync selectedWeight with context's selectedVariant
  useEffect(() => {
    if (product?.hasVariantOptions) {
      if (selectedWeight) {
        setSelectedVariant(selectedWeight);
        if (selectedWeight.variantImage?.url) {
          setSelectedImage(selectedWeight.variantImage);
        }
      }
    } else {
      setSelectedVariant(null);
    }
  }, [selectedWeight, product, setSelectedVariant, setSelectedImage]);

  // Handle subscription opening - similar to Listing logic
  const handleOpenSubscribePopup = () => {
    let subFreqs = [];
    let discount = 0;
    const currentVar = selectedWeight || sortedVariants[0];

    if (product.hasVariantOptions && currentVar) {
      subFreqs = currentVar.subFreq || [];
      discount = currentVar.subscriptionDiscount || 0;
      setSelectedSubProduct({
        parent: product,
        variant: currentVar,
        isVariant: true,
        discount,
        subFreqs,
      });
    } else {
      subFreqs = product.subFreq || [];
      discount = product.subscriptionDiscount || 0;
      setSelectedSubProduct({
        parent: product,
        isVariant: false,
        discount,
        subFreqs,
      });
    }

    if (subFreqs.length > 0) {
      setSelectedFrequency(subFreqs[0]);
    }

    // Auto-select first bag amount option so bagAmountId is always sent to checkout
    const bagOptions = product.hasVariantOptions && currentVar
      ? currentVar.bagAmountOptions || []
      : product.bagAmountOptions || [];
    if (bagOptions.length > 0) {
      setSelectedQuantity(parseInt(bagOptions[0].amount));
      setSelectedBagAmountId(bagOptions[0].id);
    } else {
      setSelectedQuantity(2);
      setSelectedBagAmountId(null);
    }

    setShowSubscribe(true);
  };


  useEffect(() => {
    if (!showSubscribe) return;
  }, [showSubscribe]);

  // Handle subscription checkout
  const handleSubscriptionCheckout = () => {
    if (!selectedSubProduct || !selectedFrequency) {
      console.error("Please select a frequency");
      return;
    }

    const highlightsPayload = formatHighlightsForPayload(selectedHighlights);

    // Navigate to checkout with subscription parameters
    const params = new URLSearchParams({
      mode: "subscription",
      productId: selectedSubProduct.parent.id,
      subscriptionId: selectedFrequency.id || selectedFrequency._id || "",
      variationId: selectedSubProduct.isVariant ? selectedSubProduct.variant.id : "",
      quantity: selectedQuantity.toString(),
      bagAmountId: selectedBagAmountId || "",
      productHighlights: JSON.stringify(highlightsPayload),
    });

    router.push(`/checkout?${params.toString()}`);
  };

  const getFrequencyLabel = (freq) => {
    if (!freq) return "";
    return `Every ${freq.duration} ${freq.interval}${freq.duration > 1 ? "s" : ""}`;
  };

  // Determine current stock status
  const isOutOfStock = product?.hasVariantOptions
    ? !selectedWeight?.variantInStock
    : product?.inStock === false;

  const stockQuantity = product?.hasVariantOptions
    ? selectedWeight?.variantStockQuantity
    : product?.stockQuantity;

  const currentCartQty =
    items?.find(
      (item) =>
        item.product === product.id &&
        (!product.hasVariantOptions || item.vId === selectedWeight?.id),
    )?.quantity || 0;

  const isLowStock = !isOutOfStock && stockQuantity > 0 && stockQuantity <= 10;

  // Determine current price based on product type and selection
  const simplePrice = product?.hasVariantOptions
    ? selectedWeight?.variantSalePrice ||
    selectedWeight?.variantRegularPrice ||
    0
    : product?.salePrice || product?.regularPrice || 0;

  const subscriptionOptions = {
    quantities: [1, 2, 3], // Default bag amounts
    weights: sortedVariants.map((v) => v.variantName),
    frequencies: product?.hasVariantOptions
      ? selectedWeight?.subFreq
      : product?.subFreq || [],
  };

  return (
    <>
      <div className={styles.main}>
        <div className={styles.MainContainer}>
          <div className={styles.Left}>
            <h4>{`${product?.name} ${product?.tagline}`}</h4>
            <p>{product?.tastingNotes || ""}</p>
          </div>

          <div className={styles.Center}>
            <div className={styles.CounterWrapper}>
              <div
                className={`${styles.CountIncDec} ${isOutOfStock ? styles.Muted : ""}`}
              >
                <button
                  onClick={() => {
                    setQty((q) => Math.max(1, q - 1));
                    setQtyError("");
                  }}
                  disabled={isOutOfStock || qty <= 1}
                >
                  −
                </button>
                <span>{String(qty).padStart(2, "0")}</span>
                <button
                  onClick={() => {
                    const maxAllowed = Math.min(10, stockQuantity - currentCartQty);
                    if (qty < maxAllowed) {
                      setQty((q) => q + 1);
                      setQtyError("");
                    } else {
                      if (qty + currentCartQty >= stockQuantity) {
                        setQtyError("Stock limit reached");
                      }
                    }
                  }}
                  disabled={
                    qty >= 10 || qty + currentCartQty >= stockQuantity || isOutOfStock
                  }
                >
                  +
                </button>
              </div>
              {qtyError && <p className={styles.QtyError}>{qtyError}</p>}
            </div>

            {product?.hasVariantOptions && (
              <div className={styles.WeightDropdown}>
                <button
                  className={styles.WeightSelect}
                  onClick={() => setShowWeightMenu((prev) => !prev)}
                >
                  <span>{selectedWeight?.variantName}g</span>
                  <svg
                    width="13"
                    height="8"
                    viewBox="0 0 13 8"
                    /* Swapped the logic: Up means closed, Down means open for a dropup */
                    className={showWeightMenu ? styles.RotateDown : styles.RotateUp}
                  >
                    <path d="M6.25635 0L0.0000755461 7.40326L12.5126 7.40326L6.25635 0Z" fill="#6C7A5F" />
                  </svg>
                </button>

                <div className={`${styles.WeightMenuWrapper} ${showWeightMenu ? styles.Open : ""}`}>
                  <div className={styles.WeightMenuContent}>
                    {sortedVariants.map((v) => (
                      <button
                        key={v.id}
                        className={`${styles.WeightMenuItem} ${!v.variantInStock ? styles.WeightMenuItemOos : ""}`}
                        onClick={() => {
                          setSelectedWeight(v);
                          setShowWeightMenu(false);
                        }}
                      >
                        <span>{v.variantName}g</span>
                        {!v.variantInStock && <span className={styles.OosLabel}>Out of stock</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.Right}>
            {!isOutOfStock && <p className={styles.type}>Purchase type :</p>}

            <div className={styles.Cta}>
              {/* Subscription CTA temporarily disabled — recurring billing not yet confirmed end-to-end.
              {!isOutOfStock &&
                (selectedWeight?.hasVariantSub || product?.hasSimpleSub) && (
                  <button
                    className={styles.SubscribeCta}
                    onClick={handleOpenSubscribePopup}
                  >
                    <span>Subscribe and Save 10–20% </span>

                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        width="18"
                        height="18"
                        rx="9"
                        transform="matrix(-1 0 0 1 18 0)"
                        fill="#6C7A5F"
                      />
                      <path
                        d="M8 6L11 9L8 12"
                        stroke="white"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              */}

              {isOutOfStock ? (
                <button
                  className={`${styles.AddtoCartPriceCta} ${styles.DisabledCta}`}
                  disabled
                >
                  Out of Stock
                </button>
              ) : (
                <button
                  className={styles.AddtoCartPriceCta}
                  onClick={() => setShowCartPopup(true)}
                >
                  {`Buy for AED ${Number(simplePrice).toFixed(2)}`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <SubscriptionPopup
        showSubscribePopup={showSubscribe}
        setShowSubscribePopup={setShowSubscribe}
        selectedProduct={selectedSubProduct}
        setSelectedProduct={setSelectedSubProduct}
        selectedFrequency={selectedFrequency}
        setSelectedFrequency={setSelectedFrequency}
        selectedQuantity={selectedQuantity}
        setSelectedQuantity={setSelectedQuantity}
        selectedBagAmountId={selectedBagAmountId}
        setSelectedBagAmountId={setSelectedBagAmountId}
        selectedHighlights={selectedHighlights}
        setSelectedHighlights={setSelectedHighlights}
        handleSubscriptionCheckout={handleSubscriptionCheckout}
        getFrequencyLabel={getFrequencyLabel}
        items={items}
      />

      <AddToCartPopup
        showCartPopup={showCartPopup}
        onClose={() => setShowCartPopup(false)}
        selectedProduct={product}
        initialQuantity={qty}
        initialVariant={selectedWeight}
        initialHighlights={selectedHighlights}
      />
    </>
  );
};

export default StickyBar;
