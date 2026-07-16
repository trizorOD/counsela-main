import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { steps } from "./data/steps";
import {
    clearSavedData,
    getSavedFormData,
    normalizeLanguage,
    saveFormData,
    saveLanguage
} from "./utils/storage";
import { useIsDesktop, useIsMobile } from "./hooks/useMediaQuery";
import {
    normalizeCollectedFormData,
    readFormControl,
    updateFormDataFromControl,
    validateFields
} from "./utils/form.js";

function App() {
    const { t, i18n } = useTranslation();
    const swiperRef = useRef(null);
    const loggedCompletionRef = useRef("");
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState(getSavedFormData);
    const [backNavigation, setBackNavigation] = useState(null);
    const [mobileNavigation, setMobileNavigation] = useState(null);
    const isMobile = useIsMobile();
    const isDesktop = useIsDesktop();

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
    }, [activeStep, i18n.language, isDesktop, isMobile]);

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

    const handleMobileNavigationChange = useCallback((stepId, navigation) => {
        setMobileNavigation((currentNavigation) => {
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

    const handleTransitionStart = useCallback(() => {
        window.scrollTo({
            left: 0,
            top: 0,
            behavior: "auto"
        });
    }, []);

    const activeMobileNavigation = mobileNavigation?.stepId === currentStep.id
        ? mobileNavigation
        : null;
    const activeBackNavigation = backNavigation?.stepId === currentStep.id
        ? backNavigation
        : null;
    const currentStepHasErrors = currentStep.validationFields
        ? Object.keys(validateFields(currentStep.validationFields, formData)).length > 0
        : false;

    return (
        <div className={`wrapper ${activeStep > 0 ? "content" : ""}`}>
            <div className="layout">
                <Header
                    activeStep={progressStep}
                    showProgress={activeStep > 0}
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
                        onSwiper={(swiper) => {
                            swiperRef.current = swiper;
                        }}
                        onSlideChange={(swiper) => {
                            setActiveStep(swiper.activeIndex);
                        }}
                        onSlideChangeTransitionStart={handleTransitionStart}
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
                                        onBackNavigationChange={handleBackNavigationChange}
                                        onFormChange={handleFormChange}
                                        onComplete={completeStep}
                                        onFieldChange={updateFormData}
                                        onLayoutChange={updateScreenHeight}
                                        onMobileNavigationChange={handleMobileNavigationChange}
                                        onNext={goNext}
                                        formData={formData}
                                        selectedLanguage={formData.language}
                                        isActive={isCurrentStep}
                                        isMobile={isMobile}
                                        isDesktop={isDesktop}
                                    />
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>
                </form>

                {isMobile && !currentStep.hideFooter && (
                    <Footer
                        disabled={activeMobileNavigation
                            ? activeMobileNavigation.disabled
                            : currentStepHasErrors || Boolean(currentStep.requiresNavigationOverride)}
                        details={currentStep.id === "language"
                            ? [t("language.info.firstText"), t("language.info.secondaryText")]
                            : []}
                        onNext={activeMobileNavigation?.onNext || goNext}
                    />
                )}
            </div>
        </div>
    );
}

export default App;
