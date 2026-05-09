import React from "react";
import styles from "./Landing.module.css";
import defaultImage from "./11.jpg";
import coffeeBeansImage from "./coffeebeans.webp";
import coffeeCapsulesImage from "./coffeecapsules.webp";

const categoryImageMap = {
  "coffee-beans": coffeeBeansImage.src,
  "coffee-capsules": coffeeCapsulesImage.src,
};

const Landing = ({ category }) => {
  const bgImage = categoryImageMap[category] || defaultImage.src;

  return (
    <section
      className={styles.Main}
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className={styles.MainContainer}></div>
    </section>
  );
};

export default Landing;
