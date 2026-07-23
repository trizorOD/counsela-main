import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import gsap from "gsap";
import { StatementFlowProvider } from "../features/statement/StatementFlowProvider.jsx";
import {
    clearSavedData,
    getSavedFormData,
    normalizeLanguage,
    saveFormData,
    saveLanguage
} from "../utils/storage";
import {
    normalizeCollectedFormData,
    readFormControl,
    updateFormDataFromControl,
    validateFields
} from "../utils/form.js";

function Questionnaire({ version }) {
    const { t, i18n } = useTranslation();
    const { Footer, Header, steps } = version;
    const swiperRef = useRef(null);
    const loggedCompletionRef = useRef("");
    const activeTransitionRef = useRef(null);
    const transitionDurationRef = useRef(0);
    const pendingFromHeightRef = useRef(null);
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState(getSavedFormData);
    const [backNavigation, setBackNavigation] = useState(null);
    const [screenNavigation, setScreenNavigation] = useState(null);

    const currentStep = steps[activeStep];
    const progressStep = activeStep + 1;
    const totalSteps = steps.length;

    useEffect(() => {
        const frameId = requestAnimationFrame(() => {
            swiperRef.current?.updateAutoHeight();
        });

        return () => {
            cancelAnimationFrame(frameId);
        };
    }, [activeStep, i18n.language, version.id]);

    useEffect(() => {
        saveFormData(formData);
    }, [formData]);

    useEffect(() => {
        if (!currentStep.isCompletion) {
            return;
        }

        const collectedData = normalizeCollectedFormData(formData);
        const fingerprint = JSON.stringify(collectedData);

        if (loggedCompletionRef.current === fingerprint) {
            return;
        }

        loggedCompletionRef.current = fingerprint;
        console.log("Collected form data:", collectedData);
        clearSavedData();
    }, [currentStep, formData]);

    const updateFormData = useCallback((name, value) => {
        setFormData((currentData) => ({
            ...currentData,
            [name]: typeof value === "function" ? value(currentData[name], currentData) : value
        }));
    }, []);

    const updateScreenHeight = useCallback(() => {
        requestAnimationFrame(() => {
            swiperRef.current?.updateAutoHeight();
        });
    }, []);

    const handleScreenNavigationChange = useCallback((stepId, navigation) => {
        setScreenNavigation((currentNavigation) => {
            if (navigation) {
                return {
                    ...navigation,
                    stepId
                };
            }

            return currentNavigation?.stepId === stepId ? null : currentNavigation;
        });
    }, []);

    const handleBackNavigationChange = useCallback((stepId, navigation) => {
        setBackNavigation((currentNavigation) => {
            if (navigation) {
                return {
                    ...navigation,
                    stepId
                };
            }

            return currentNavigation?.stepId === stepId ? null : currentNavigation;
        });
    }, []);

    function handleFormChange(event) {
        const control = readFormControl(event.target);

        if (!control || control.type === "radio" && !control.checked) {
            return;
        }

        if (control.name === "language") {
            changeLanguage(control.value);
            return;
        }

        setFormData((currentData) => updateFormDataFromControl(currentData, control));
    }

    function changeLanguage(language) {
        const nextLanguage = normalizeLanguage(language);

        saveLanguage(nextLanguage);
        updateFormData("language", nextLanguage);
        i18n.changeLanguage(nextLanguage);
    }

    const goToStep = useCallback((stepIndex) => {
        if (!swiperRef.current || stepIndex < 0 || stepIndex >= totalSteps) {
            return;
        }

        pendingFromHeightRef.current = swiperRef.current.wrapperEl.offsetHeight;
        swiperRef.current.slideTo(stepIndex);
    }, [totalSteps]);

    const goNext = useCallback(() => {
        if (currentStep.validationFields) {
            const errors = validateFields(currentStep.validationFields, formData);

            if (Object.keys(errors).length > 0) {
                return false;
            }
        }

        const nextStep = activeStep + 1;

        if (nextStep >= totalSteps) {
            return false;
        }

        goToStep(nextStep);
        return true;
    }, [activeStep, currentStep.validationFields, formData, goToStep, totalSteps]);

    const completeStep = useCallback((nextFormData) => {
        if (currentStep.validationFields) {
            const errors = validateFields(currentStep.validationFields, nextFormData);

            if (Object.keys(errors).length > 0) {
                return false;
            }
        }

        const nextStep = activeStep + 1;

        if (nextStep >= totalSteps) {
            return false;
        }

        setFormData(nextFormData);
        goToStep(nextStep);
        return true;
    }, [activeStep, currentStep.validationFields, goToStep, totalSteps]);

    const goBack = useCallback(() => {
        goToStep(activeStep - 1);
    }, [activeStep, goToStep]);

    const handleSetTransition = useCallback((swiper, duration) => {
        transitionDurationRef.current = duration;
        // Swiper still applies its own CSS transition-duration for height even in
        // virtualTranslate mode; zero it out so it can't fight the GSAP height tween.
        swiper.wrapperEl.style.transitionDuration = "0ms";
    }, []);

    const handleTransitionStart = useCallback((swiper) => {
        window.scrollTo({
            left: 0,
            top: 0,
            behavior: "auto"
        });

        activeTransitionRef.current?.kill();

        const outgoingEl = swiper.slides[swiper.previousIndex];
        const incomingEl = swiper.slides[swiper.activeIndex];
        const duration = transitionDurationRef.current;

        // Swiper's autoHeight already snapped wrapperEl's height synchronously
        // (transitionStart -> updateAutoHeight, before this event fires). Flip it
        // back to the pre-transition height and let GSAP morph it forward, since we
        // zeroed the CSS transition that used to animate height for us.
        const fromHeight = pendingFromHeightRef.current;
        const toHeight = swiper.wrapperEl.offsetHeight;

        pendingFromHeightRef.current = null;

        // Keep both slides paintable for the duration of the crossfade regardless
        // of Swiper's own active-slide class bookkeeping (which already flipped to
        // the new index by this point).
        outgoingEl.style.visibility = "visible";
        incomingEl.style.visibility = "visible";
        incomingEl.style.zIndex = 2;
        outgoingEl.style.zIndex = 1;

        const resetInlineStyles = () => {
            outgoingEl.style.visibility = "";
            outgoingEl.style.zIndex = "";
            incomingEl.style.zIndex = "";
            gsap.set(outgoingEl, { opacity: 1 });
        };

        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (duration === 0 || prefersReducedMotion) {
            gsap.set(incomingEl, { opacity: 1 });
            gsap.set(swiper.wrapperEl, { height: toHeight });
            resetInlineStyles();
            return;
        }

        const tl = gsap.timeline({
            onComplete: () => {
                resetInlineStyles();
                swiper.wrapperEl.dispatchEvent(new CustomEvent("transitionend", {
                    bubbles: true,
                    cancelable: true
                }));
            }
        });
        const tweenDuration = duration / 1000;

        gsap.set(incomingEl, { opacity: 0 });
        tl.to(incomingEl, { opacity: 1, duration: tweenDuration, ease: "power3.out" }, 0);
        tl.to(outgoingEl, { opacity: 0, duration: tweenDuration, ease: "power3.out" }, 0);

        if (fromHeight != null && fromHeight !== toHeight) {
            gsap.set(swiper.wrapperEl, { height: fromHeight });
            tl.to(swiper.wrapperEl, { height: toHeight, duration: tweenDuration, ease: "power3.out" }, 0);
        }

        activeTransitionRef.current = tl;
    }, []);

    useEffect(() => () => activeTransitionRef.current?.kill(), []);

    const activeScreenNavigation = screenNavigation?.stepId === currentStep.id
        ? screenNavigation
        : null;
    const activeBackNavigation = backNavigation?.stepId === currentStep.id
        ? backNavigation
        : null;
    const currentStepHasErrors = currentStep.validationFields
        ? Object.keys(validateFields(currentStep.validationFields, formData)).length > 0
        : false;

    return (
        <StatementFlowProvider
            activeStepId={currentStep.id}
            formData={formData}
            onFieldChange={updateFormData}
            onLayoutChange={updateScreenHeight}
            onNext={goNext}
        >
            <div className={`wrapper wrapper--${version.id} ${activeStep > 0 ? "content" : ""}`}>
                <div className="layout">
                    <Header
                        activeStep={progressStep}
                        totalSteps={totalSteps}
                        titleStep={t(currentStep.titleKey)}
                        onBack={activeBackNavigation?.onBack || goBack}
                    />

                    <form className="form" noValidate onSubmit={(event) => event.preventDefault()}>
                        <Swiper
                            className="screens"
                            autoHeight={true}
                            allowTouchMove={false}
                            preventClicks={false}
                            preventClicksPropagation={false}
                            preventInteractionOnTransition={true}
                            speed={300}
                            spaceBetween={48}
                            virtualTranslate={true}
                            onSwiper={(swiper) => {
                                swiperRef.current = swiper;
                            }}
                            onSlideChange={(swiper) => {
                                setActiveStep(swiper.activeIndex);
                            }}
                            onSlideChangeTransitionStart={handleTransitionStart}
                            onSetTransition={handleSetTransition}
                        >
                            {steps.map((step) => {
                                const isCurrentStep = step.id === currentStep.id;

                                return (
                                    <SwiperSlide
                                        aria-hidden={!isCurrentStep}
                                        inert={!isCurrentStep}
                                        key={step.id}
                                    >
                                        <step.Component
                                            View={step.View}
                                            onBackNavigationChange={handleBackNavigationChange}
                                            onFormChange={handleFormChange}
                                            onComplete={completeStep}
                                            onFieldChange={updateFormData}
                                            onLayoutChange={updateScreenHeight}
                                            onScreenNavigationChange={Footer
                                                ? handleScreenNavigationChange
                                                : undefined}
                                            onNext={goNext}
                                            formData={formData}
                                            selectedLanguage={formData.language}
                                            isActive={isCurrentStep}
                                        />
                                    </SwiperSlide>
                                );
                            })}
                        </Swiper>
                    </form>

                    {Footer && !currentStep.hideFooter && (
                        <Footer
                            disabled={activeScreenNavigation
                                ? activeScreenNavigation.disabled
                                : currentStepHasErrors
                                    || Boolean(currentStep.requiresNavigationOverride)}
                            details={currentStep.id === "language"
                                ? [t("language.info.firstText"), t("language.info.secondaryText")]
                                : []}
                            hidden={Boolean(activeScreenNavigation?.hidden)}
                            onNext={activeScreenNavigation?.onNext || goNext}
                        />
                    )}
                </div>
            </div>
        </StatementFlowProvider>
    );
}

export default Questionnaire;
