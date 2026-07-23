import { createSteps } from "../../data/steps";
import { screenControllers } from "../../app/screenControllers";
import CaseScreen from "./screens/CaseScreen";
import CommunicationScreen from "./screens/CommunicationScreen";
import ContactScreen from "./screens/ContactScreen";
// import CredentialsScreen from "./screens/CredentialsScreen";
import DoneScreen from "./screens/DoneScreen";
import FocusScreen from "./screens/FocusScreen";
import LanguageScreen from "./screens/LanguageScreen";
import PriceScreen from "./screens/PriceScreen";
import StatementRecordScreen from "./screens/StatementRecordScreen";
import StatementResultScreen from "./screens/StatementResultScreen";

export const desktopSteps = createSteps({
    case: CaseScreen,
    communication: CommunicationScreen,
    contact: ContactScreen,
    // credentials: CredentialsScreen,
    done: DoneScreen,
    focus: FocusScreen,
    language: LanguageScreen,
    price: PriceScreen,
    statementRecord: StatementRecordScreen,
    statementResult: StatementResultScreen
}, screenControllers);
