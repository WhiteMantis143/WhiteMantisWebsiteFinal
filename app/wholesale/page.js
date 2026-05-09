export const metadata = {
  title: "Wholesale | White Mantis",
  description: "Partner with White Mantis Roastery for wholesale specialty coffee. We supply cafes, restaurants, and businesses across the UAE with premium freshly roasted coffee.",
  openGraph: {
    title: "Wholesale | White Mantis",
    description: "Partner with White Mantis Roastery for wholesale specialty coffee. We supply cafes, restaurants, and businesses across the UAE with premium freshly roasted coffee.",
    images: [{ url: "/social-thumbnail.png", width: 1200, height: 630, alt: "White Mantis Wholesale Coffee" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wholesale | White Mantis",
    description: "Partner with White Mantis Roastery for wholesale specialty coffee. We supply cafes, restaurants, and businesses across the UAE with premium freshly roasted coffee.",
    images: ["/social-thumbnail.png"],
  },
};

import Landing from "./_components/Landing/Landing";
import Partner from "./_components/Partner/Partner";

import Enquires from "./_components/Enquiries/Enquires";
import Begins from "./_components/Begins/Begins";

export default function Wholesale() {
  return (
    <>
      <Landing />
      <div className="sectionPadding"></div>
      <Partner />
      <div className="sectionPadding"></div>
      <Enquires />
      <div className="sectionPadding"></div>
      <Begins />
      <div className="sectionPadding"></div>
    </>
  );
}
