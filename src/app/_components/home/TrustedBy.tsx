import React from "react";
import Image from "next/image";

const TrustedBy = () => {
  return (
    <section className="bg-gray-50 py-8">
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-4 px-4">
        <p className="font-semibold text-gray-700">Trusted by:</p>
        <Image
          src="https://placehold.co/80x40/000000/ffffff?text=meta"
          unoptimized
          alt="Meta"
          width={80}
          height={40}
        />
        <Image
          src="https://placehold.co/80x40/000000/ffffff?text=google"
          alt="Google"
          width={80}
          height={40}
        />
        <Image
          src="https://placehold.co/80x40/000000/ffffff?text=netflix"
          alt="Netflix"
          width={80}
          height={40}
        />
        <Image
          src="https://placehold.co/80x40/000000/ffffff?text=p&g"
          alt="P&G"
          width={80}
          height={40}
        />
        <Image
          src="https://placehold.co/80x40/000000/ffffff?text=paypal"
          alt="PayPal"
          width={80}
          height={40}
        />
      </div>
    </section>
  );
};

export default TrustedBy;
