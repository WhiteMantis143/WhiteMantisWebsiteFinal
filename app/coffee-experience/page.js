import React from "react";

export const metadata = {
  title: "Coffee Experience | White Mantis",
  description:
    "Join our monthly Coffee Tasting Experience at White Mantis Roastery — a guided journey through a rotating specialty coffee, straight from the farm to your cup.",
  openGraph: {
    title: "Coffee Experience | White Mantis",
    description:
      "Join our monthly Coffee Tasting Experience at White Mantis Roastery — a guided journey through a rotating specialty coffee, straight from the farm to your cup.",
    images: [{ url: "/social-thumbnail.png", width: 1200, height: 630, alt: "White Mantis Coffee Experience" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coffee Experience | White Mantis",
    description:
      "Join our monthly Coffee Tasting Experience at White Mantis Roastery — a guided journey through a rotating specialty coffee, straight from the farm to your cup.",
    images: ["/social-thumbnail.png"],
  },
};

import Landing from "./_components/Landing/Landing";
import SessionBooking from "./_components/SessionBooking/SessionBooking";
import WhoIsItFor from "./_components/WhoIsItFor/WhoIsItFor";
import ExperienceHighlights from "./_components/ExperienceHighlights/ExperienceHighlights";
import RoasteryGallery from "./_components/RoasteryGallery/RoasteryGallery";
import FaqSection from "./_components/FaqSection/FaqSection";
import CoffeeExperienceGate from "./_components/CoffeeExperienceGate";
import spacerStyles from "./_components/FooterSpacer/FooterSpacer.module.css";

export default function CoffeeExperience() {
  return (
    <CoffeeExperienceGate>
      <Landing />
      <SessionBooking />
      <WhoIsItFor />
      <ExperienceHighlights />
      <RoasteryGallery />
      <FaqSection />
      <div className={spacerStyles.spacer}></div>
    </CoffeeExperienceGate>
  );
}
