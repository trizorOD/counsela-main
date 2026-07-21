import { useCaseScreen } from "./useCaseScreen.js";

function CaseScreenController({ View, ...screenProps }) {
    const caseScreen = useCaseScreen(screenProps);

    return <View {...screenProps} caseScreen={caseScreen} />;
}

export default CaseScreenController;
