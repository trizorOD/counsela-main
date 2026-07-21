import { createContext, useContext } from "react";
import { useStatementFlow } from "./useStatementFlow.js";

const StatementFlowContext = createContext(null);

export function StatementFlowProvider({ children, ...flowProps }) {
    const statementFlow = useStatementFlow(flowProps);

    return (
        <StatementFlowContext.Provider value={statementFlow}>
            {children}
        </StatementFlowContext.Provider>
    );
}

export function useStatementFlowContext() {
    const statementFlow = useContext(StatementFlowContext);

    if (!statementFlow) {
        throw new Error("Statement screens must be rendered inside StatementFlowProvider.");
    }

    return statementFlow;
}
