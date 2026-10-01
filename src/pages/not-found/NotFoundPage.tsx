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
    const ctx = gsap.context(() => {
      // Main container fade in
      gsap.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8, ease: "power2.out" },
      );

      // Content slide up and scale
      gsap.fromTo(
        contentRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "power3.out" },
      );

      // Icon float animation (continuous)
      gsap.fromTo(
        iconRef.current,
        { y: 0 },
        { y: -12, duration: 2.5, repeat: -1, yoyo: true, ease: "sine.inOut" },
      );
    }, containerRef);

    return () => ctx.revert();
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
          <h1 className="font-cormorant text-[96px] sm:text-[128px] font-normal text-text-primary leading-none tracking-tight">
            404
          </h1>
          <h2 className="font-cormorant text-[28px] sm:text-[36px] font-normal text-text-primary">
            Page Not Found
          </h2>
          <p className="text-[15px] text-text-secondary max-w-md mx-auto leading-[1.7]">
            Sorry, we couldn't find the page you're looking for. It might have
            been moved or deleted.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button
            variant="primary"
            size="lg"
            className="w-full sm:w-auto min-w-[160px]"
            onClick={handleGoHome}
          >
            <FiHome className="mr-2 w-4 h-4" />
            Go to Home
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto min-w-[160px]"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
