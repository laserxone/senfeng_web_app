import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(
    typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = (e) => {
      setIsMobile(e.matches);
    };

    // Set initial value
    setIsMobile(mql.matches);

    // Add listener (modern + fallback)
    if (mql.addEventListener) {
      mql.addEventListener("change", onChange);
    } else {
      // Safari fallback
      mql.addListener(onChange);
    }

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", onChange);
      } else {
        // Safari fallback
        mql.removeListener(onChange);
      }
    };
  }, []);

  return isMobile;
}
