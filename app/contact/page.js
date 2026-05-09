import Image from "next/image";

export const metadata = {
  title: "Contact Us | White Mantis",
  description: "Get in touch with White Mantis Roastery. Visit us in Dubai, send us a message, or reach out to our team — we'd love to hear from you.",
  openGraph: {
    title: "Contact Us | White Mantis",
    description: "Get in touch with White Mantis Roastery. Visit us in Dubai, send us a message, or reach out to our team — we'd love to hear from you.",
    images: [{ url: "/social-thumbnail.png", width: 1200, height: 630, alt: "Contact White Mantis Roastery" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | White Mantis",
    description: "Get in touch with White Mantis Roastery. Visit us in Dubai, send us a message, or reach out to our team — we'd love to hear from you.",
    images: ["/social-thumbnail.png"],
  },
};
import Landing from "./_components/Landing/Landing";
import MightFit from "./_components/MightFit/MightFit";
import Career from "./_components/Career/Career";
import Location from "./_components/Location/Location";
import ContactForm from "./_components/ContactForm/ContactForm";

export default function contact() {
  return (
    <>
      <Landing />
      <div className="sectionPadding"> </div>
      <ContactForm />
      <div className="sectionPadding"> </div>
      <Location />
      <div className="sectionPadding"> </div>
      {/* <Career />*/}
      {/* <MightFit /> */}
    </>
  );
}
