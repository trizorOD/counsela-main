const stepDefinitions = [
    {
        id: "language",
        titleKey: "steps.language"
    },
    {
        id: "focus",
        titleKey: "steps.focus"
    },
    {
        id: "communication",
        titleKey: "steps.communication"
    },
    {
        id: "price",
        titleKey: "steps.price"
    },
    {
        id: "credentials",
        titleKey: "steps.credentials"
    },
    {
        id: "case",
        titleKey: "steps.case",
        validationFields: ["case"]
    },
    {
        id: "statementRecord",
        requiresNavigationOverride: true,
        titleKey: "steps.statement"
    },
    {
        id: "statementResult",
        requiresNavigationOverride: true,
        titleKey: "steps.statement"
    },
    {
        hideFooter: true,
        id: "contact",
        titleKey: "steps.contact",
        validationFields: ["fullName", "email", "phone", "contactMethod"]
    },
    {
        hideFooter: true,
        id: "done",
        isCompletion: true,
        titleKey: "steps.contact"
    }
];

export function createSteps(views, controllers) {
    return stepDefinitions.map((step) => {
        const Component = controllers[step.id];
        const View = views[step.id];

        if (!Component || !View) {
            throw new Error(`Incomplete screen registration for step: ${step.id}`);
        }

        return {
            ...step,
            Component,
            View
        };
    });
}
