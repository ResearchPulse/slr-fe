import React from "react";
import { useNavigate } from "react-router";
import { FiX } from "react-icons/fi";

const PolicyPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen w-full bg-bg-primary px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-xl border border-border bg-surface-white">
        {/* Header */}
        <div className="relative border-b border-border bg-bg-secondary px-5 py-8 sm:px-10 sm:py-9">
          <button
            onClick={() => navigate("/auth/signin")}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface-white text-text-secondary transition-colors duration-150 hover:bg-bg-primary hover:text-text-primary motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:right-6 sm:top-6"
            aria-label="Close"
          >
            <FiX className="w-4 h-4" />
          </button>
          <div className="mt-8 sm:mt-2">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              Legal Information
            </p>
            <h1 className="mb-3 text-3xl font-semibold leading-tight tracking-tight text-text-primary sm:text-4xl">
              Privacy Policy &amp; Terms
            </h1>
            <p className="text-sm text-text-secondary">
              Last updated: January 11, 2026
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-8 px-5 py-8 sm:space-y-10 sm:px-10 sm:py-10">
          {/* Section 1 */}
          <section className="space-y-4">
            <div className="border-b border-border pb-3 mb-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-text-secondary mb-1">
                01
              </p>
              <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
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
              <p className="text-[10px] uppercase tracking-[0.25em] text-text-secondary mb-1">
                02
              </p>
              <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
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
              <p className="text-[10px] uppercase tracking-[0.25em] text-text-secondary mb-1">
                03
              </p>
              <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
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
              <p className="text-[10px] uppercase tracking-[0.25em] text-text-secondary mb-1">
                04
              </p>
              <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
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
            <a href="mailto:privacy@slrs.com" className="inline-flex min-h-11 items-center text-accent font-medium hover:underline">
              privacy@slrs.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PolicyPage;
