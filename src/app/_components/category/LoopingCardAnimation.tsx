import { Check } from "lucide-react";
import Image from "next/image";

const LoopingCardAnimation = () => {
  return (
    <>
      <style>
        {`
          /* Keyframes for the 'peek-a-boo' animation */
          @keyframes card-peek-1 { /* Top Card */
            0%, 100% {
              transform: translateY(0) scale(1);
              z-index: 3;
            }
            50% {
              transform: translateY(-15px) scale(1.05);
              z-index: 3;
            }
          }
          @keyframes card-peek-2 { /* Middle Card (Peeks Left) */
            0%, 100% {
              transform: translateY(-10px) scale(0.95);
              z-index: 2;
            }
            50% {
              transform: translateY(-10px) translateX(-80px) rotate(-8deg) scale(0.95);
              z-index: 2;
            }
          }
          @keyframes card-peek-3 { /* Back Card (Peeks Right) */
            0%, 100% {
              transform: translateY(-20px) scale(0.9);
              z-index: 1;
            }
            50% {
              transform: translateY(-10px) translateX(80px) rotate(8deg) scale(0.95);
              z-index: 1;
            }
          }

          .card-container-wrapper {
            position: relative;
            width: 300px;
            height: 320px; /* Increased height to show stack */
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto; /* Center the container */
          }

          .animated-profile-card {
            position: absolute;
            width: 200px;
            height: 280px;
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            animation-iteration-count: infinite;
            animation-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Bounce effect */
            animation-duration: 4s; /* Faster 4-second loop */
          }

          .animated-card-1 {
            animation-name: card-peek-1;
          }
          .animated-card-2 {
            animation-name: card-peek-2;
          }
          .animated-card-3 {
            animation-name: card-peek-3;
          }
        `}
      </style>

      <div className="container mx-auto px-4 py-10">
        <div className="relative flex min-h-[400px] flex-col items-center justify-between overflow-hidden rounded-lg bg-yellow-50 p-6 md:flex-row md:p-8">
          {/* Left Side: Text Content */}
          <div className="z-10 mb-12 w-full md:mb-0 md:w-1/2 md:pr-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-800 md:text-3xl">
              Big event planning? We&apos;ll handle it
            </h2>
            <p className="mb-4 text-gray-600">
              From vendor sourcing to day-of coordination, work with a certified
              event manager who:
            </p>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start sm:items-center">
                <Check className="mt-1 mr-2 h-5 w-5 flex-shrink-0 text-green-600 sm:mt-0" />
                Consistently manages large and small events
              </li>
              <li className="flex items-start sm:items-center">
                <Check className="mt-1 mr-2 h-5 w-5 flex-shrink-0 text-green-600 sm:mt-0" />
                Was carefully selected and certified by Partygeng
              </li>
              <li className="flex items-start sm:items-center">
                <Check className="mt-1 mr-2 h-5 w-5 flex-shrink-0 text-green-600 sm:mt-0" />
                Has proven expertise in your event&apos;s domain
              </li>
            </ul>
            <button className="mt-6 rounded-md bg-gray-900 px-5 py-3 font-semibold text-white transition-colors hover:bg-gray-700">
              Book a free consultation
            </button>
          </div>

          {/* Right Side: Looping Card Animation */}
          <div className="relative flex min-h-[320px] w-full items-center justify-center md:absolute md:inset-y-0 md:right-0 md:h-full md:w-1/2">
            <div className="card-container-wrapper">
              <div className="animated-profile-card animated-card-1">
                <div className="relative mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                  <Image
                    src="https://placehold.co/100x100/ADD8E6/000?text=👤"
                    alt="Profile 1"
                    className="h-full w-full rounded-full object-cover"
                    width={80}
                    height={80}
                  />
                  <div className="absolute inset-0 rounded-full border-2 border-blue-500"></div>
                </div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800">
                  Alex P.
                </h4>
                <div className="mb-2 h-3 w-full rounded-sm bg-gray-200"></div>
                <div className="mb-1 h-2 w-4/5 rounded-sm bg-gray-200"></div>
                <div className="mb-1 h-2 w-full rounded-sm bg-gray-200"></div>
                <div className="h-2 w-3/4 rounded-sm bg-gray-200"></div>
              </div>

              <div className="animated-profile-card animated-card-2">
                <div className="relative mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                  <Image
                    src="https://placehold.co/100x100/FFB6C1/000?text=👩"
                    alt="Profile 2"
                    className="h-full w-full rounded-full object-cover"
                    width={80}
                    height={80}
                  />
                  <div className="absolute inset-0 rounded-full border-2 border-red-500"></div>
                </div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800">
                  Sophia L.
                </h4>
                <div className="mb-2 h-3 w-full rounded-sm bg-gray-200"></div>
                <div className="mb-1 h-2 w-4/5 rounded-sm bg-gray-200"></div>
                <div className="mb-1 h-2 w-full rounded-sm bg-gray-200"></div>
                <div className="h-2 w-3/4 rounded-sm bg-gray-200"></div>
              </div>

              <div className="animated-profile-card animated-card-3">
                <div className="relative mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100">
                  <Image
                    src="https://placehold.co/100x100/FFD700/000?text=👦"
                    alt="Profile 3"
                    className="h-full w-full rounded-full object-cover"
                    width={80}
                    height={80}
                  />
                  <div className="absolute inset-0 rounded-full border-2 border-yellow-500"></div>
                </div>
                <h4 className="mb-2 text-lg font-semibold text-gray-800">
                  Ben K.
                </h4>
                <div className="mb-2 h-3 w-full rounded-sm bg-gray-200"></div>
                <div className="mb-1 h-2 w-4/5 rounded-sm bg-gray-200"></div>
                <div className="mb-1 h-2 w-full rounded-sm bg-gray-200"></div>
                <div className="h-2 w-3/4 rounded-sm bg-gray-200"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoopingCardAnimation;
