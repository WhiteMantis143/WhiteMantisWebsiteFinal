"use client";

import React, { useState } from "react";
import styles from "./Enquires.module.css";
import Image from "next/image";
import one from "./1.png";
import axiosClient from "@/lib/axios";

const Enquires = () => {
  const MAX_LENGTHS = {
  businessName: 60,
  contactName: 40,
  location: 120,
  branch: 50,
  website: 150,
  message: 500,
};
  const [formData, setFormData] = useState({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    location: "",
    branch: "",
    website: "",
    categories: [],
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [otherCategory, setOtherCategory] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [responseError, setResponseError] = useState(false);

const handleChange = (e) => {
  const { name, value } = e.target;

  // phone validation (numbers only)
if (name === "phone") {

  // allow only numbers and one "+" at start
  const cleanedValue = value.replace(/[^\d+]/g, "");

  // prevent multiple "+"
  if (
    cleanedValue.indexOf("+") > 0 ||
    (cleanedValue.match(/\+/g) || []).length > 1
  ) {
    return;
  }

  if (cleanedValue.length <= 15) {
    setFormData((prev) => ({
      ...prev,
      [name]: cleanedValue,
    }));
  }

  return;
}

  // character limit validation
  if (MAX_LENGTHS[name]) {
    if (value.length <= MAX_LENGTHS[name]) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    return;
  }

  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));
};

  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const currentCategories = prev.categories;
      if (checked) {
        return { ...prev, categories: [...currentCategories, value] };
      } else {
        return {
          ...prev,
          categories: currentCategories.filter((cat) => cat !== value),
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResponseMessage("");
    setResponseError(false);

    if (
      !formData.businessName ||
      !formData.contactName ||
      !formData.email ||
      !formData.phone ||
      !formData.location
    ) {
      setResponseError(true);
      setResponseMessage("Please fill in all required fields.");
      return;
    }
// email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(formData.email)) {
  setResponseError(true);
  setResponseMessage("Please enter a valid email address.");
  return;
}

// phone validation
if (
  formData.phone.replace(/\D/g, "").length < 10,
  formData.phone.replace(/\D/g, "").length > 14
) {
  setResponseError(true);
  setResponseMessage(
    "Phone number must be between 10 and 14 digits."
  );
  return;
}
    setLoading(true);

    try {
      const payload = {
        email: formData.email,
        phone: formData.phone,
        company: formData.businessName,
        branch: formData.branch || "",
        companyAddress: formData.location,
        websiteInstagram: formData.website || "",
        business_info_group: {
          office: formData.categories.includes("Office"),
          bakery: formData.categories.includes("Bakery"),
          coffee_shop: formData.categories.includes("Coffee Shop"),
          restaurant: formData.categories.includes("Restaurant"),
          other: formData.categories.includes("Other"),
          other_specification: formData.categories.includes("Other")
            ? formData.message
            : "",
        },
        message: formData.message,
      };

      const res = await axiosClient.post("/api/wholesale", payload);

      if (res.status === 201) {
        setResponseError(false);
        setResponseMessage(
          "Thank you! Your wholesale enquiry has been submitted.",
        );

        setFormData({
          businessName: "",
          contactName: "",
          email: "",
          phone: "",
          location: "",
          branch: "",
          website: "",
          categories: [],
          message: "",
        });

        setOtherCategory("");

        // auto-hide message after 3 seconds (same UX as contact form)
        setTimeout(() => {
          setResponseMessage("");
        }, 3000);
      } else {
        setResponseError(true);
        setResponseMessage(res.data.message || "Failed to submit enquiry");
      }
    } catch (error) {
      console.error("Submission error:", error);
      const resData = error?.response?.data;
      const backendMsg =
        resData?.message || resData?.error || resData?.errors?.[0]?.message;
      setResponseError(true);
      setResponseMessage(backendMsg || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.Main} id="wholesaleEnquiry">
      <div className={styles.MainContainer}>
        <div className={styles.Left}>
          <Image src={one} alt="Enquires Image" />
        </div>

        <div className={styles.Right}>
          <div className={styles.RightTop}>
            <h3>Start the Conversation</h3>
            <p>
              Tell us a little about your business and what you're looking for.
              We'll follow up within 24 hours.
            </p>
          </div>

          <div className={styles.RightBottom}>
            <form className={styles.Form} onSubmit={handleSubmit}>
              <div className={styles.FormGroup}>
                <input
                  type="text"
                  name="businessName"
                  placeholder="Business Name*"
                  maxLength={60}
                  value={formData.businessName}
                  onChange={handleChange}
                  suppressHydrationWarning
                  required
                />

                <div className={styles.TwoCol}>
                  <input
                    type="text"
                    name="contactName"
                    maxLength={40}
                    placeholder="Contact Name*"
                    value={formData.contactName}
                    onChange={handleChange}
                    suppressHydrationWarning
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email address*"
                    value={formData.email}
                    onChange={handleChange}
                    suppressHydrationWarning
                    required
                  />
                </div>

                <input
                  type="text"
                  name="phone"
                  placeholder="Phone number*"
                  value={formData.phone}
                  inputMode="numeric"
                  onChange={handleChange}
                  maxLength={15}
                  suppressHydrationWarning
                  required
                />
                <input
                  type="text"
                  name="location"
                  placeholder="Business location*"
                  value={formData.location}
                  onChange={handleChange}
                  maxLength={120}
                  suppressHydrationWarning
                  required
                />
                <input
                  type="text"
                  name="branch"
                  placeholder="Branch (if any)"
                  value={formData.branch}
                  maxLength={50}
                  onChange={handleChange}
                  suppressHydrationWarning
                />
                <input
                  type="text"
                  name="website"
                  placeholder="Website/Instagram"
                  value={formData.website}
                  onChange={handleChange}
                  maxLength={150}
                />

                <div className={styles.CheckboxBlock}>
                  <p>
                    What best describes your business? (Select all that apply)
                  </p>

                  <label>
                    <input
                      type="checkbox"
                      value="Office"
                      checked={formData.categories.includes("Office")}
                      onChange={handleCategoryChange}
                    />{" "}
                    Office
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      value="Bakery"
                      checked={formData.categories.includes("Bakery")}
                      onChange={handleCategoryChange}
                    />{" "}
                    Bakery
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      value="Coffee Shop"
                      checked={formData.categories.includes("Coffee Shop")}
                      onChange={handleCategoryChange}
                    />{" "}
                    Coffee Shop
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      value="Restaurant"
                      checked={formData.categories.includes("Restaurant")}
                      onChange={handleCategoryChange}
                    />{" "}
                    Restaurant
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      value="Other"
                      checked={formData.categories.includes("Other")}
                      onChange={handleCategoryChange}
                    />{" "}
                    Other (Specify below)
                  </label>
                </div>

                <textarea
                  name="message"
                  placeholder="Tell us a bit more about your business and how can we help you."
                  rows={4}
                  className={styles.Textarea}
                  maxLength={500}
                  value={formData.message}
                  onChange={handleChange}
                />
              </div>
              <div className={styles.SubButton}>
                <div className={styles.SubmitWrap}>
                  <button
                    type="submit"
                    className={styles.SubmitButton}
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Enquiry"}
                  </button>

                  {responseMessage && (
                    <div
                      className={styles.ResponseMessage}
                      data-error={responseError}
                    >
                      {responseMessage}
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enquires;
