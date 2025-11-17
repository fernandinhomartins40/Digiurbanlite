import * as React from "react"
import { cn } from "@/lib/utils"
import { Input, InputProps } from "./input"

export interface InputWithCounterProps extends InputProps {
  maxLength?: number;
  showCounter?: boolean;
}

const InputWithCounter = React.forwardRef<HTMLInputElement, InputWithCounterProps>(
  ({ className, maxLength, showCounter = true, ...props }, ref) => {
    const [length, setLength] = React.useState(0);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const showCounterElement = showCounter && maxLength;
    const isNearLimit = maxLength && length >= maxLength * 0.8;
    const isAtLimit = maxLength && length >= maxLength;

    return (
      <div className="relative">
        <Input
          ref={ref}
          className={className}
          maxLength={maxLength}
          {...props}
          onChange={handleChange}
        />
        {showCounterElement && (
          <div
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 text-xs pointer-events-none",
              isAtLimit ? "text-red-600 font-semibold" : isNearLimit ? "text-yellow-600" : "text-gray-400"
            )}
          >
            {length}/{maxLength}
          </div>
        )}
      </div>
    );
  }
);

InputWithCounter.displayName = "InputWithCounter";

export { InputWithCounter };
