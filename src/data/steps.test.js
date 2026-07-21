import assert from "node:assert/strict";
import test from "node:test";
import { createSteps } from "./steps.js";

const expectedStepIds = [
    "language",
    "focus",
    "communication",
    "price",
    "credentials",
    "case",
    "statementRecord",
    "statementResult",
    "contact",
    "done"
];

function createRegistry(prefix) {
    return Object.fromEntries(expectedStepIds.map((stepId) => [
        stepId,
        function RegisteredStep() {
            return `${prefix}-${stepId}`;
        }
    ]));
}

test("registers record and result as separate steps in the main flow", () => {
    const controllers = createRegistry("controller");
    const views = createRegistry("view");
    const steps = createSteps(views, controllers);

    assert.deepEqual(steps.map(({ id }) => id), expectedStepIds);

    for (const step of steps) {
        assert.equal(step.Component, controllers[step.id]);
        assert.equal(step.View, views[step.id]);
    }
});

test("rejects an incomplete version registration", () => {
    const controllers = createRegistry("controller");
    const views = createRegistry("view");

    delete views.statementResult;

    assert.throws(
        () => createSteps(views, controllers),
        /Incomplete screen registration for step: statementResult/
    );
});
