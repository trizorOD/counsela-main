import { useEffect } from "react";
import { useStatementFlowContext } from "./StatementFlowProvider.jsx";

function StatementResultScreenController({
    View,
    isActive,
    onBackNavigationChange,
    onNext,
    onScreenNavigationChange,
    ...screenProps
}) {
    const statementFlow = useStatementFlowContext();
    const {
        cancelEditing,
        isEditing,
        resultDisabled,
        textareaRef
    } = statementFlow;

    useEffect(() => {
        if (!isActive || !onScreenNavigationChange) {
            return undefined;
        }

        onScreenNavigationChange("statementResult", {
            disabled: resultDisabled,
            hidden: isEditing,
            onNext
        });

        return () => {
            onScreenNavigationChange("statementResult", null);
        };
    }, [isActive, isEditing, onNext, onScreenNavigationChange, resultDisabled]);

    useEffect(() => {
        if (!isActive || !isEditing) {
            return undefined;
        }

        onBackNavigationChange("statementResult", {
            onBack: cancelEditing
        });

        return () => {
            onBackNavigationChange("statementResult", null);
        };
    }, [cancelEditing, isActive, isEditing, onBackNavigationChange]);

    useEffect(() => {
        if (!isActive || !isEditing) {
            return undefined;
        }

        const frameId = requestAnimationFrame(() => {
            textareaRef.current?.focus();
        });

        return () => cancelAnimationFrame(frameId);
    }, [View, isActive, isEditing, textareaRef]);

    return (
        <View
            {...screenProps}
            onNext={onNext}
            statementFlow={statementFlow}
        />
    );
}

export default StatementResultScreenController;
