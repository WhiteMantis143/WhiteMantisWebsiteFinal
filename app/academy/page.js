import React from "react";

export const metadata = {
  title: "Coffee Academy | White Mantis",
  description: "Level up your coffee skills at White Mantis Academy. Explore upcoming workshops, barista training, and specialty coffee courses hosted in Dubai.",
  openGraph: {
    title: "Coffee Academy | White Mantis",
    description: "Level up your coffee skills at White Mantis Academy. Explore upcoming workshops, barista training, and specialty coffee courses hosted in Dubai.",
    images: [{ url: "/social-thumbnail.png", width: 1200, height: 630, alt: "White Mantis Coffee Academy" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coffee Academy | White Mantis",
    description: "Level up your coffee skills at White Mantis Academy. Explore upcoming workshops, barista training, and specialty coffee courses hosted in Dubai.",
    images: ["/social-thumbnail.png"],
  },
};
import UpComing from "./_components/UpComing/UpComing";
import Highlights from "./_components/Highlights/Highlights";
import Landing from "./_components/Landing/Landing";

export default function WorkShops() {
  return (
    <>
      <Landing />
      <UpComing />
      <Highlights />
    </>
  );
}