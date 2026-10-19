import React, { useState, useEffect, useRef } from "react";
import { Calendar, X } from "lucide-react";
import { cn } from "../../../utils/cn";

interface YearRangeSliderProps {
  fromYear: number;
  toYear: number;
  minYear?: number;
  maxYear?: number;
  onChange: (from: number, to: number) => void;
  onClear: () => void;
}

const YearRangeSlider: React.FC<YearRangeSliderProps> = ({
  fromYear,
  toYear,
  minYear = 1900,
  maxYear = new Date().getFullYear(),
  onChange,
  onClear,
}) => {
  const [minVal, setMinVal] = useState(fromYear);
  const [maxVal, setMaxVal] = useState(toYear);
  const minRef = useRef<HTMLInputElement>(null);
  const maxRef = useRef<HTMLInputElement>(null);
  const range = useRef<HTMLDivElement>(null);

  // Convert to percentage
  const getPercent = (value: number) =>
    Math.round(((value - minYear) / (maxYear - minYear)) * 100);

  // Set width of the range to decrease from the left side
  useEffect(() => {
    if (maxRef.current) {
      const minPercent = getPercent(minVal);
      const maxPercent = getPercent(+maxRef.current.value);

      if (range.current) {
        range.current.style.left = `${minPercent}%`;
        range.current.style.width = `${maxPercent - minPercent}%`;
      }
    }
  }, [minVal, getPercent]);

  // Set width of the range to decrease from the right side
  useEffect(() => {
    if (minRef.current) {
      const minPercent = getPercent(+minRef.current.value);
      const maxPercent = getPercent(maxVal);

      if (range.current) {
        range.current.style.width = `${maxPercent - minPercent}%`;
      }
    }
  }, [maxVal, getPercent]);

  const handleMinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(+event.target.value, maxVal - 1);
    setMinVal(value);
  };

  const handleMaxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(+event.target.value, minVal + 1);
    setMaxVal(value);
  };

  const handleMouseUp = () => {
    onChange(minVal, maxVal);
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-accent" />
          <span className="text-xs font-black text-text-primary uppercase tracking-wider">
            Publication Years
          </span>
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label="Reset publication years"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-text-secondary uppercase">
            From
          </span>
          <span className="text-sm font-black text-text-primary">{minVal}</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[10px] font-bold text-text-secondary uppercase">
            To
          </span>
          <span className="text-sm font-black text-text-primary">{maxVal}</span>
        </div>
      </div>

      <div className="relative h-10 flex items-center">
        <input
          type="range"
          aria-label="Minimum publication year"
          min={minYear}
          max={maxYear}
          value={minVal}
          ref={minRef}
          onChange={handleMinChange}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          className={cn(
            "thumb thumb--zindex-3",
            minVal > maxYear - 100 && "thumb--zindex-5",
          )}
        />
        <input
          type="range"
          aria-label="Maximum publication year"
          min={minYear}
          max={maxYear}
          value={maxVal}
          ref={maxRef}
          onChange={handleMaxChange}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          className="thumb thumb--zindex-4"
        />

        <div className="slider">
          <div className="slider__track bg-border" />
          <div ref={range} className="slider__range bg-primary" />
        </div>
      </div>

      <div className="flex justify-between mt-1">
        <span className="text-[9px] font-bold text-text-secondary">{minYear}</span>
        <span className="text-[9px] font-bold text-text-secondary">{maxYear}</span>
      </div>

      <style>{`
        .slider {
          position: relative;
          width: 100%;
        }

        .slider__track,
        .slider__range {
          position: absolute;
          height: 6px;
          border-radius: 999px;
        }

        .slider__track {
          width: 100%;
          z-index: 1;
        }

        .slider__range {
          z-index: 2;
        }

        /* Removing default appearance */
        .thumb,
        .thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          -webkit-tap-highlight-color: transparent;
        }

        .thumb {
          pointer-events: none;
          position: absolute;
          height: 0;
          width: 100%;
          outline: none;
          z-index: 3;
        }

        .thumb--zindex-3 {
          z-index: 3;
        }

        .thumb--zindex-4 {
          z-index: 4;
        }

        .thumb--zindex-5 {
          z-index: 5;
        }

        /* For Chrome browsers */
        .thumb::-webkit-slider-thumb {
          background-color: #ffffff;
          border: 2px solid var(--color-primary);
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(18, 35, 49, 0.16);
          cursor: pointer;
          height: 18px;
          width: 18px;
          margin-top: 4px;
          pointer-events: all;
          position: relative;
        }

        /* For Firefox browsers */
        .thumb::-moz-range-thumb {
          background-color: #ffffff;
          border: 2px solid var(--color-primary);
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(18, 35, 49, 0.16);
          cursor: pointer;
          height: 18px;
          width: 18px;
          pointer-events: all;
          position: relative;
        }

        .thumb:focus-visible::-webkit-slider-thumb,
        .thumb:focus-visible::-moz-range-thumb {
          box-shadow: 0 0 0 4px rgb(0 113 188 / 0.22);
        }
      `}</style>
    </div>
  );
};

export default YearRangeSlider;
