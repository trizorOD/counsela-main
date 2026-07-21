import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useStatementFlowContext } from "./StatementFlowProvider.jsx";
import { getStatementGuidanceKey } from "./statementGuidance.js";

function StatementRecordScreenController({
    View,
    isActive,
    onScreenNavigationChange,
    ...screenProps
}) {
    const { t } = useTranslation();
    const statementFlow = useStatementFlowContext();
    const { processRecordings, recordDisabled } = statementFlow;
    const guidanceKey = getStatementGuidanceKey(screenProps.formData?.case);
    const statementGuidance = t(`statement.guidance.${guidanceKey}`, {
        returnObjects: true
    });

    useEffect(() => {
        if (!isActive || !onScreenNavigationChange) {
            return undefined;
        }

        onScreenNavigationChange("statementRecord", {
            disabled: recordDisabled,
            onNext: processRecordings
        });

        return () => {
            onScreenNavigationChange("statementRecord", null);
        };
    }, [isActive, onScreenNavigationChange, processRecordings, recordDisabled]);

    return (
        <View
            {...screenProps}
            statementFlow={statementFlow}
            statementGuidance={statementGuidance}
        />
    );
}

export default StatementRecordScreenController;
