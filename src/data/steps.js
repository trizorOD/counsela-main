import CaseScreen from "../screens/CaseScreen";
import CredentialsScreen from "../screens/CredentialsScreen";
import PriceScreen from "../screens/PriceScreen";
import CommunicationScreen from "../screens/CommunicationScreen";
import FocusScreen from "../screens/FocusScreen";
import LanguageScreen from "../screens/LanguageScreen";
import StatementScreen from "../screens/StatementScreen";
import ContactScreen from "../screens/ContactScreen";
import DoneScreen from "../screens/DoneScreen";

export const steps = [
    {
        Component: LanguageScreen,
        id: "language",
        titleKey: "steps.language"
    },
    {
        Component: FocusScreen,
        id: "focus",
        titleKey: "steps.focus"
    },
    {
        Component: CommunicationScreen,
        id: "communication",
        titleKey: "steps.communication"
    },
    {
        Component: PriceScreen,
        id: "price",
        titleKey: "steps.price"
    },
    {
        Component: CredentialsScreen,
        id: "credentials",
        titleKey: "steps.credentials"
    },
    {
        Component: CaseScreen,
        id: "case",
        titleKey: "steps.case",
        validationFields: ["cases"]
    },
    {
        Component: StatementScreen,
        id: "statement",
        requiresNavigationOverride: true,
        titleKey: "steps.statement"
    },
    {
        Component: ContactScreen,
        hideFooter: true,
        id: "contact",
        titleKey: "steps.contact",
        validationFields: ["fullName", "email", "phone", "contactMethod"]
    },
    {
        Component: DoneScreen,
        hideFooter: true,
        id: "done",
        isCompletion: true,
        titleKey: "steps.contact"
    }
];
