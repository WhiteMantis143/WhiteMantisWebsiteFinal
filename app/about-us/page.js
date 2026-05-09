import styles from "./About.module.css";

export const metadata = {
  title: "About Us | White Mantis",
  description: "Discover the story behind White Mantis Roastery — a specialty coffee roastery born in Dubai, built on craft, community, and an unwavering passion for exceptional coffee.",
  openGraph: {
    title: "About Us | White Mantis",
    description: "Discover the story behind White Mantis Roastery — a specialty coffee roastery born in Dubai, built on craft, community, and an unwavering passion for exceptional coffee.",
    images: [{ url: "/social-thumbnail.png", width: 1200, height: 630, alt: "About White Mantis Roastery" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us | White Mantis",
    description: "Discover the story behind White Mantis Roastery — a specialty coffee roastery born in Dubai, built on craft, community, and an unwavering passion for exceptional coffee.",
    images: ["/social-thumbnail.png"],
  },
};
import Landing from "./_components/Landing/Landing";
import OurPhilosophy from "./_components/OurPhilosophy/OurPhilosophy";
import Recognitions from "./_components/Recognitions/Recognitions";
import Partnerships from "./_components/Partnerships/Partnerships";
import WhyUs from "./_components/WhyUs/WhyUs";
import OurValues from "./_components/OurValues/OurValues";

export default function AboutUs() {
  return (
    <>
      <div className="TopPaddingForMobile"></div>
      <Landing />
      <div className="sectionPadding"></div>
      <OurPhilosophy />
      <div className="sectionPadding"></div>
      <OurValues />
      <div className="sectionPadding"></div>
      <WhyUs />
      <div className="sectionPadding"></div>
      <Partnerships />
      <div className="sectionPadding"></div>
      {/* <Recognitions /> */}
    </>
  );
}
