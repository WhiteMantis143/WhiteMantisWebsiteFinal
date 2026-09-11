"use client";
import React from "react";
import styles from "./EmptyState.module.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import zeroImage from "../../../academy/_components/UpComing/upcomingZero.png";

const EmptyState = () => {
  const router = useRouter();

  return (
    <div className={styles.main}>
      <div className={styles.Box}>
        <Image src={zeroImage} alt="No Coffee Experience available" width={190} height={180} />
        <h2 className={styles.Heading}>No Coffee Experience Right Now</h2>
        <p className={styles.SubText}>
          Our next monthly tasting session is still being brewed — check back soon, or explore
          what&apos;s already on the shelf.
        </p>
        <button className={styles.Button} onClick={() => router.push("/shop")}>
          Explore Coffee
        </button>
      </div>
    </div>
  );
};

export default EmptyState;
