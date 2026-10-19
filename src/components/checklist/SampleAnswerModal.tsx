import React, { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { FiCopy, FiCheck } from "react-icons/fi";

import type { SampleAnswerData } from "../../types/checklist";

interface SampleAnswerModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SampleAnswerData | null;
}

/**
 * Modal displaying sample/example answers for checklist items from PRISMA guidelines
 */
const SampleAnswerModal: React.FC<SampleAnswerModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (data?.sampleAnswer) {
      navigator.clipboard.writeText(data.sampleAnswer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!data) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Sample Answer: Item ${data.itemNumber}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Item Topic */}
        <div className="bg-bg-secondary border border-accent/20 rounded-xl p-4">
          <p className="text-sm font-medium text-text-secondary">Topic</p>
          <p className="text-lg font-semibold text-text-primary mt-1">
            {data.topic}
          </p>
        </div>

        {/* Sample Answer */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-text-primary">
              Sample Answer
            </h3>
            <button
              onClick={handleCopy}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface-white px-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
              title="Copy sample answer"
            >
              {copied ? (
                <>
                  <FiCheck className="w-4 h-4 text-success" />
                  <span className="text-success">Copied</span>
                </>
              ) : (
                <>
                  <FiCopy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-bg-primary border border-border rounded-xl p-4">
            <p className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap">
              {data.sampleAnswer}
            </p>
          </div>
        </div>

        {/* Explanation (optional) */}
        {data.explanation && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-text-primary">
              Why this is a good answer
            </h3>
            <div className="rounded-xl border border-primary/15 bg-primary-light/50 p-4">
              <p className="text-sm leading-relaxed text-text-primary">{data.explanation}</p>
            </div>
          </div>
        )}

        {/* Hint about usage */}
        <div className="rounded-xl border border-warning/20 bg-warning/10 p-3">
          <p className="text-xs text-warning">
            💡 This is a <strong>sample answer</strong> to guide you. Your own
            answer should reflect your specific study characteristics and be
            tailored to your research context.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="secondary" onClick={onClose} size="sm" className="min-h-11">
            Close
          </Button>
          <Button
            onClick={handleCopy}
            size="sm"
            className="min-h-11 inline-flex items-center gap-2"
          >
            <FiCopy className="w-4 h-4" />
            Copy to Clipboard
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SampleAnswerModal;
