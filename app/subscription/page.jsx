export const metadata = {
  title: "Coffee Subscription | White Mantis",
  description: "Never run out of great coffee. Subscribe to White Mantis and receive freshly roasted specialty coffee delivered to your door in Dubai and across the UAE.",
  openGraph: {
    title: "Coffee Subscription | White Mantis",
    description: "Never run out of great coffee. Subscribe to White Mantis and receive freshly roasted specialty coffee delivered to your door in Dubai and across the UAE.",
    images: [{ url: "/social-thumbnail.png", width: 1200, height: 630, alt: "White Mantis Coffee Subscription" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coffee Subscription | White Mantis",
    description: "Never run out of great coffee. Subscribe to White Mantis and receive freshly roasted specialty coffee delivered to your door in Dubai and across the UAE.",
    images: ["/social-thumbnail.png"],
  },
};

import Landing from "./_components/Landing/Landing";
import Subscribe from "./_components/Subscribe/Subscribe";

import FaqSection from "./_components/FaqSection/FaqSection";

import StepsRender from "./_components/Steps/StepsRender";
import SubToday from "./_components/SubToday/SubToday";

export default function Subscription() {
  return (
    <>
     <div className="TopPaddingForMobile"></div>
      <Landing />
      <div className="sectionPadding"></div>
      <Subscribe />
      <div className="sectionPadding"></div>
      <StepsRender />
      <div className="sectionPadding"></div>
      <SubToday />
      <div className="sectionPadding"></div>
      <FaqSection />
      <div className="sectionPadding"></div>
    </>
  );
}
