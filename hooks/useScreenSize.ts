import { useState, useEffect } from "react";
import { debounce } from "@/lib/helpers-client";

export function useScreenSize() {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    const debouncedHandleResize = debounce(handleResize, 200);

    if (typeof window !== "undefined") {
      window.addEventListener("resize", debouncedHandleResize);
      handleResize(); // Call once to set initial size
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", debouncedHandleResize);
      }
    };
  }, []);

  return screenSize;
}
