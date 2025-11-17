import * as React from "react"
import { cn } from "@/lib/utils"
import { Textarea, TextareaProps } from "./textarea"

export interface TextareaWithCounterProps extends TextareaProps {
  maxLength?: number;
  minLength?: number;
  showCounter?: boolean;
}

const TextareaWithCounter = React.forwardRef<HTMLTextAreaElement, TextareaWithCounterProps>(
  ({ className, maxLength, minLength, showCounter = true, ...props }, ref) => {
    const [length, setLength] = React.useState(0);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setLength(e.target.value.length);
      if (props.onChange) {
        props.onChange(e);
      }
    };

    React.useEffect(() => {
      if (props.value) {
        setLength(String(props.value).length);
      }
    }, [props.value]);

    const showCounterElement = showCounter && (maxLength || minLength);
    const isNearLimit = maxLength && length >= maxLength * 0.8;
    const isAtLimit = maxLength && length >= maxLength;
    const isBelowMin = minLength && length > 0 && length < minLength;

    return (
      <div className="relative">
        <Textarea
          ref={ref}
          className={cn(
            className,
            showCounterElement && "pb-8" // Extra padding for counter
          )}
          maxLength={maxLength}
          {...props}
          onChange={handleChange}
        />
        {showCounterElement && (
          <div className="absolute bottom-2 right-2 flex items-center gap-2 text-xs pointer-events-none">
            {minLength && length > 0 && length < minLength && (
              <span className="text-yellow-600">
                Faltam {minLength - length} caracteres
              </span>
            )}
            <span
              className={cn(
                isAtLimit
                  ? "text-red-600 font-semibold"
                  : isNearLimit
                  ? "text-yellow-600"
                  : isBelowMin
                  ? "text-yellow-600"
                  : "text-gray-400"
              )}
            >
              {length}
              {maxLength && `/${maxLength}`}
              {!maxLength && minLength && ` (mín: ${minLength})`}
            </span>
          </div>
        )}
      </div>
    );
  }
);

TextareaWithCounter.displayName = "TextareaWithCounter";

export { TextareaWithCounter };
