import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const VibeCodingBanner = () => {
  return (
    <section className="py-16 bg-pink-100">
      <div className="container mx-auto flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Need help with Vibe coding?</h2>
          <p className="mt-4 text-lg">
            Get matched with the right expert to keep building and marketing your project
          </p>
          <Link href="/vibe_coding?utm_source=lohp_banner&utm_medium=vibe_coding_banner" className="inline-block mt-8 px-6 py-3 bg-primary-pink text-white font-bold rounded-md hover:bg-opacity-90">
            Find an expert
          </Link>
        </div>
        <div>
          <Image src="https://placehold.co/400x300" alt="Vibe Coding" width={400} height={300} />
        </div>
      </div>
    </section>
  );
};

export default VibeCodingBanner;