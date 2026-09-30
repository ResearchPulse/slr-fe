import React from "react";
import { useNavigate } from "react-router";
import { FiX } from "react-icons/fi";

const PolicyPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen w-full bg-bg-primary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto border border-border rounded-[16px] overflow-hidden bg-surface-white">
        {/* Header */}
        <div className="px-8 py-10 sm:px-12 relative border-b border-border">
          <button
            onClick={() => navigate("/auth/signup")}
            className="absolute top-6 right-6 p-2 rounded-[8px] text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-colors"
            aria-label="Close"
          >
            <FiX className="w-4 h-4" />
          </button>
          <div className="mt-2">
            <p className="text-[12px] font-medium text-text-muted mb-3">
              Legal information
            </p>
            <h1 className="text-[32px] sm:text-[40px] font-semibold text-text-primary leading-[1.15] tracking-[-0.01em] mb-3">
              Privacy Policy &amp; Terms
            </h1>
            <p className="text-text-muted text-[13px]">
              Last updated: January 11, 2026
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-8 py-10 sm:px-12 space-y-10 bg-surface-white">
          {/* Section 1 */}
          <section className="space-y-4">
            <div className="border-b border-border pb-3 mb-4">
              <p className="font-mono text-[12px] text-text-muted mb-1">
                01
              </p>
              <h2 className="text-[22px] font-semibold text-text-primary tracking-[-0.01em]">
                Introduction
              </h2>
            </div>
            <div className="text-text-secondary leading-[1.8] space-y-4 text-sm">
              <p>
                Welcome to the Systematic Literature Review System (SLRS). We
                are committed to protecting your privacy and ensuring you have a
                positive experience on our website and in using our products and
                services.
              </p>
              <p>
                This policy outlines our handling practices and how we collect
                and use the personal data you provide during your interactions
                with us.
              </p>
            </div>
          </section>

          <div className="h-[1px] bg-border" />

          {/* Section 2 */}
          <section className="space-y-4">
            <div className="border-b border-border pb-3 mb-4">
              <p className="font-mono text-[12px] text-text-muted mb-1">
                02
              </p>
              <h2 className="text-[22px] font-semibold text-text-primary tracking-[-0.01em]">
                Data Collection
              </h2>
            </div>
            <div className="text-text-secondary leading-[1.8] space-y-4 text-sm">
              <p>
                We collect information to provide better services to all our
                users. The types of information we collect include:
              </p>
              <ul className="list-none space-y-3">
                <li className="flex gap-3">
                  <span className="text-accent shrink-0 mt-0.5">—</span>
                  <span>
                    <strong className="text-text-primary font-medium">
                      Account Data:
                    </strong>{" "}
                    When you register, we collect information such as your name,
                    email address, and professional affiliation.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent shrink-0 mt-0.5">—</span>
                  <span>
                    <strong className="text-text-primary font-medium">
                      Research Data:
                    </strong>{" "}
                    Data you input for systematic reviews is stored securely and
                    is only accessible by you and your designated collaborators.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent shrink-0 mt-0.5">—</span>
                  <span>
                    <strong className="text-text-primary font-medium">
                      Usage Data:
                    </strong>{" "}
                    We gather data about how you interact with our services to
                    improve system performance and user experience.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          <div className="h-[1px] bg-border" />

          {/* Section 3 */}
          <section className="space-y-4">
            <div className="border-b border-border pb-3 mb-4">
              <p className="font-mono text-[12px] text-text-muted mb-1">
                03
              </p>
              <h2 className="text-[22px] font-semibold text-text-primary tracking-[-0.01em]">
                User Responsibilities
              </h2>
            </div>
            <div className="text-text-secondary leading-[1.8] space-y-4 text-sm">
              <p>By using our services, you agree to:</p>
              <ul className="list-none space-y-3">
                <li className="flex gap-3">
                  <span className="text-accent shrink-0 mt-0.5">—</span>
                  <span>
                    Maintain the confidentiality of your account credentials.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent shrink-0 mt-0.5">—</span>
                  <span>
                    Ensure that any data you upload complies with applicable
                    laws and ethical guidelines.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent shrink-0 mt-0.5">—</span>
                  <span>
                    Respect the intellectual property rights of others.
                  </span>
                </li>
              </ul>
              <p>
                Violation of these terms may result in the suspension or
                termination of your account.
              </p>
            </div>
          </section>

          <div className="h-[1px] bg-border" />

          {/* Section 4 */}
          <section className="space-y-4">
            <div className="border-b border-border pb-3 mb-4">
              <p className="font-mono text-[12px] text-text-muted mb-1">
                04
              </p>
              <h2 className="text-[22px] font-semibold text-text-primary tracking-[-0.01em]">
                Security Measures
              </h2>
            </div>
            <div className="text-text-secondary leading-[1.8] space-y-4 text-sm">
              <p>
                We implement industry-standard security measures to protect your
                data from unauthorized access, alteration, disclosure, or
                destruction. However, no method of transmission over the
                Internet or electronic storage is 100% secure.
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-bg-secondary px-8 py-5 border-t border-border text-center">
          <p className="text-text-secondary text-[12px]">
            For questions about this policy, please contact us at{" "}
            <span className="text-accent font-medium hover:underline cursor-pointer">
              privacy@slrs.com
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PolicyPage;
