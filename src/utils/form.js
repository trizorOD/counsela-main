import { formSchema } from "../data/formSchema.js";

function cloneDefaultValue(value) {
    return Array.isArray(value) ? [...value] : value;
}

export function getInitialFormData(overrides = {}) {
    const initialData = Object.fromEntries(
        Object.entries(formSchema).map(([name, field]) => [
            name,
            cloneDefaultValue(field.defaultValue)
        ])
    );

    return {
        ...initialData,
        ...overrides
    };
}

export function readFormControl(target) {
    if (!target?.name) {
        return null;
    }

    return {
        checked: Boolean(target.checked),
        files: target.files ? Array.from(target.files) : [],
        isMultipleValue: target.dataset?.multiple === "true",
        multiple: Boolean(target.multiple),
        name: target.name,
        selectedValues: target.multiple && target.options
            ? Array.from(target.options)
                .filter((option) => option.selected)
                .map((option) => option.value)
            : [],
        type: target.type || target.tagName?.toLowerCase() || "text",
        value: target.value
    };
}

function toggleArrayValue(currentValue, value, checked) {
    const selectedValues = Array.isArray(currentValue) ? currentValue : [];

    if (checked) {
        return selectedValues.includes(value)
            ? selectedValues
            : [...selectedValues, value];
    }

    return selectedValues.filter((selectedValue) => selectedValue !== value);
}

export function getNextFieldValue(control, currentValue, schema = formSchema) {
    const field = schema[control.name];

    if (control.type === "radio") {
        return control.checked ? control.value : currentValue;
    }

    if (control.type === "checkbox") {
        const isGroup = field?.valueType === "array" || control.isMultipleValue;

        return isGroup
            ? toggleArrayValue(currentValue, control.value, control.checked)
            : control.checked;
    }

    if (control.type === "select-multiple" || control.multiple) {
        return control.selectedValues;
    }

    if (control.type === "file") {
        return control.multiple ? control.files : control.files[0] ?? null;
    }

    if (control.type === "number" || control.type === "range" || field?.valueType === "number") {
        if (control.value === "") {
            return "";
        }

        const numberValue = Number(control.value);
        return Number.isFinite(numberValue) ? numberValue : "";
    }

    return control.value;
}

export function updateFormDataFromControl(currentData, control, schema = formSchema) {
    if (!control || control.type === "radio" && !control.checked) {
        return currentData;
    }

    return {
        ...currentData,
        [control.name]: getNextFieldValue(control, currentData[control.name], schema)
    };
}

function coerceFieldValue(value, field) {
    if (field.valueType === "array") {
        return Array.isArray(value)
            ? value.filter((item) => ["number", "string"].includes(typeof item))
            : cloneDefaultValue(field.defaultValue);
    }

    if (field.valueType === "boolean") {
        return typeof value === "boolean" ? value : field.defaultValue;
    }

    if (field.valueType === "number") {
        return value === "" || Number.isFinite(value) ? value : field.defaultValue;
    }

    if (field.valueType === "string") {
        return typeof value === "string" ? value : field.defaultValue;
    }

    return value ?? cloneDefaultValue(field.defaultValue);
}

export function coerceFormData(data = {}, overrides = {}, schema = formSchema) {
    return Object.entries(schema).reduce((result, [name, field]) => ({
        ...result,
        [name]: coerceFieldValue(
            data[name],
            overrides[name] === undefined
                ? field
                : { ...field, defaultValue: overrides[name] }
        )
    }), {
        ...data
    });
}

function normalizeValue(value) {
    if (typeof value === "string") {
        return value.trim();
    }

    if (Array.isArray(value)) {
        return value
            .map((item) => typeof item === "string" ? item.trim() : item)
            .filter((item) => item !== "" && item !== undefined && item !== null);
    }

    return value;
}

export function normalizeCollectedFormData(data, schema = formSchema) {
    const coercedData = coerceFormData(data, {}, schema);

    return Object.fromEntries(
        Object.entries(coercedData)
            .filter(([, value]) => value !== undefined)
            .map(([name, value]) => [name, normalizeValue(value)])
    );
}

function isEmpty(value) {
    if (typeof value === "string") {
        return value.trim() === "";
    }

    if (Array.isArray(value)) {
        return value.length === 0;
    }

    return value === undefined || value === null || value === false;
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhone(value) {
    const phone = value.trim();
    const digits = phone.replace(/\D/g, "");

    return /^\+?[0-9\s().-]+$/.test(phone)
        && digits.length >= 7
        && digits.length <= 15;
}

function rulePasses(rule, value, allData) {
    const validatesEmptyValue = ["checked", "maxItems", "minItems", "required"]
        .includes(rule.type);

    if (!validatesEmptyValue && isEmpty(value)) {
        return true;
    }

    switch (rule.type) {
        case "required":
            return !isEmpty(value);
        case "email":
            return typeof value === "string" && isValidEmail(value);
        case "phone":
            return typeof value === "string" && isValidPhone(value);
        case "minLength":
            return typeof value === "string" && value.trim().length >= rule.value;
        case "maxLength":
            return typeof value === "string" && value.trim().length <= rule.value;
        case "min":
            return typeof value === "number" && value >= rule.value;
        case "max":
            return typeof value === "number" && value <= rule.value;
        case "minItems":
            return Array.isArray(value) && value.length >= rule.value;
        case "maxItems":
            return Array.isArray(value) && value.length <= rule.value;
        case "checked":
            return value === true;
        case "pattern":
            return typeof value === "string" && rule.value.test(value);
        case "custom": {
            const customResult = rule.validate(value, allData);
            return customResult === true ? true : customResult;
        }
        default:
            return true;
    }
}

export function validateField(name, value, allData = {}, schema = formSchema) {
    const rules = schema[name]?.rules || [];

    for (const rule of rules) {
        const result = rulePasses(rule, value, allData);

        if (result !== true) {
            return typeof result === "string" ? result : rule.messageKey;
        }
    }

    return null;
}

export function validateFields(fieldNames, data, schema = formSchema) {
    return fieldNames.reduce((errors, name) => {
        const error = validateField(name, data[name], data, schema);

        if (error) {
            errors[name] = error;
        }

        return errors;
    }, {});
}

export function isFormValid(fieldNames, data, schema = formSchema) {
    return Object.keys(validateFields(fieldNames, data, schema)).length === 0;
}
