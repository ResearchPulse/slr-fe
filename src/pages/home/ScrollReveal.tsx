import { useLayoutEffect, useRef, type CSSProperties, type PropsWithChildren } from "react";

type ScrollRevealProps = PropsWithChildren<{
  className?: string;
  delay?: number;
}>;

export default function ScrollReveal({ children, className = "", delay = 0 }: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    element.dataset.reveal = "pending";
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      element.dataset.reveal = "visible";
      observer.unobserve(element);
    }, { threshold: 0.16 });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={elementRef}
      className={`landing-reveal ${className}`}
      style={{ "--landing-reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
