import { memo } from "react";
import { useIsDesktop } from "../../hooks/useMediaQuery";
import ProcessDesktopCard from "./ProcessDesktopCard";
import ProcessMobileCarousel from "./ProcessMobileCarousel";

function ProcessCarouselViewport() {
  const isDesktop = useIsDesktop();

  return isDesktop ? <ProcessDesktopCard /> : <ProcessMobileCarousel />;
}

export default memo(ProcessCarouselViewport);
