import { useEffect, useRef } from "react";

function LottieAnimation({ animationData, className = "" }) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) {
            return undefined;
        }

        let animation;
        let cancelled = false;

        import("lottie-web/build/player/lottie_light").then(({ default: lottie }) => {
            if (cancelled || !containerRef.current) {
                return;
            }

            animation = lottie.loadAnimation({
                animationData,
                autoplay: true,
                container: containerRef.current,
                loop: true,
                renderer: "svg",
                rendererSettings: {
                    preserveAspectRatio: "xMidYMid meet"
                }
            });
        });

        return () => {
            cancelled = true;
            animation?.destroy();
        };
    }, [animationData]);

    return <div className={className} ref={containerRef} aria-hidden="true"></div>;
}

export default LottieAnimation;
