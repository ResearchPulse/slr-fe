import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { FiHome, FiAlertCircle } from "react-icons/fi";
import Button from "../../components/ui/Button";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";

const NotFoundPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleGoHome = () => {
    if (user?.role === "Admin") {
      navigate("/admin");
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set([containerRef.current, contentRef.current, iconRef.current], {
        opacity: 1,
        y: 0,
      });
    });

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        gsap.fromTo(
          containerRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.18, ease: "power2.out" },
        );
      }, containerRef);

      return () => ctx.revert();
    });

    return () => media.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen w-full flex items-center justify-center bg-bg-primary px-4 sm:px-6 lg:px-8 opacity-0"
    >
      <div ref={contentRef} className="max-w-max w-full text-center space-y-8">
        {/* Animated Icon Section */}
        <div className="flex justify-center mb-6">
          <div
            ref={iconRef}
            className="w-20 h-20 sm:w-24 sm:h-24 border border-border bg-bg-secondary flex items-center justify-center text-text-secondary"
          >
            <FiAlertCircle className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-4">
          <p className="text-[11px] uppercase tracking-[0.3em] text-text-secondary">
            Error
          </p>
          <h1 className="text-[72px] font-bold leading-none tracking-tight text-text-primary sm:text-[96px]">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-text-primary sm:text-3xl">
            Page Not Found
          </h2>
          <p className="text-[15px] text-text-secondary max-w-md mx-auto leading-[1.7]">
            Sorry, we couldn't find the page you're looking for. It might have
            been moved or deleted.
          </p>
        </div>

        {/* Recovery action */}
        <div className="flex justify-center pt-4">
          <Button
            variant="primary"
            size="lg"
            className="w-full sm:w-auto min-w-[160px]"
            onClick={handleGoHome}
          >
            <FiHome className="mr-2 w-4 h-4" />
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
