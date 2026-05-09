export const metadata = {
  title: "Merchandise & Equipment | White Mantis",
  description: "Browse White Mantis merchandise and coffee equipment — from stylish branded gear to professional brewing tools for the perfect specialty coffee experience.",
  openGraph: {
    title: "Merchandise & Equipment | White Mantis",
    description: "Browse White Mantis merchandise and coffee equipment — from stylish branded gear to professional brewing tools for the perfect specialty coffee experience.",
    images: [{ url: "/social-thumbnail.png", width: 1200, height: 630, alt: "White Mantis Merchandise & Equipment" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Merchandise & Equipment | White Mantis",
    description: "Browse White Mantis merchandise and coffee equipment — from stylish branded gear to professional brewing tools for the perfect specialty coffee experience.",
    images: ["/social-thumbnail.png"],
  },
};

import GridFilter from './_components/GridFilter/GridFilter';
import Landing from './_components/Landing/Landing';

export default function ShopMerchandise() {
  return (
    <>
      <Landing />
      <GridFilter />
    </>
  );
}
