export const statementGuidanceKeysByCase = Object.freeze({
    family: "family",
    "work-business": "workBusiness",
    protection: "protection",
    defense: "defense",
    other: "other"
});

export function getStatementGuidanceKey(caseValue) {
    return Object.hasOwn(statementGuidanceKeysByCase, caseValue)
        ? statementGuidanceKeysByCase[caseValue]
        : statementGuidanceKeysByCase.other;
}
