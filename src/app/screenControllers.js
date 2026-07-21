import ScreenController from "./ScreenController";
import CaseScreenController from "../features/case/CaseScreenController";
import ContactScreenController from "../features/contact/ContactScreenController";
import StatementRecordScreenController from "../features/statement/StatementRecordScreenController";
import StatementResultScreenController from "../features/statement/StatementResultScreenController";

export const screenControllers = {
    case: CaseScreenController,
    communication: ScreenController,
    contact: ContactScreenController,
    credentials: ScreenController,
    done: ScreenController,
    focus: ScreenController,
    language: ScreenController,
    price: ScreenController,
    statementRecord: StatementRecordScreenController,
    statementResult: StatementResultScreenController
};
