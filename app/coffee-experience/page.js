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

export default function CoffeeExperience() {
  return (
    <>
      <Landing />
      <SessionBooking />
      <WhoIsItFor />
    </>
  );
}
