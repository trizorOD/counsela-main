import { useTranslation } from "react-i18next";
import { useFocusRotation } from "./useFocusRotation.js";

function FocusScreenController({ View, isActive, ...screenProps }) {
    const { t } = useTranslation();
    const teams = t("focus.teams", { returnObjects: true });
    const focusTeams = Array.isArray(teams) ? teams : [];
    const focusRotation = useFocusRotation({
        isActive,
        teamCount: focusTeams.length
    });

    return (
        <View
            {...screenProps}
            focusRotation={focusRotation}
            focusTeams={focusTeams}
        />
    );
}

export default FocusScreenController;
