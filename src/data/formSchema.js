import { defaultLanguage } from "./languages.js";

export const contactFieldNames = [
    "fullName",
    "email",
    "phone",
    "contactMethod"
];

export const formSchema = {
    language: {
        defaultValue: defaultLanguage,
        valueType: "string"
    },
    case: {
        defaultValue: "",
        valueType: "string",
        rules: [
            {
                type: "required",
                messageKey: "validation.selectOne"
            }
        ]
    },
    statement: {
        defaultValue: "",
        valueType: "string"
    },
    fullName: {
        defaultValue: "",
        valueType: "string",
        rules: [
            {
                type: "required",
                messageKey: "validation.required"
            },
            {
                type: "minLength",
                value: 2,
                messageKey: "validation.tooShort"
            },
            {
                type: "maxLength",
                value: 120,
                messageKey: "validation.tooLong"
            }
        ]
    },
    email: {
        defaultValue: "",
        valueType: "string",
        rules: [
            {
                type: "required",
                messageKey: "validation.required"
            },
            {
                type: "email",
                messageKey: "validation.email"
            },
            {
                type: "maxLength",
                value: 254,
                messageKey: "validation.tooLong"
            }
        ]
    },
    phone: {
        defaultValue: "",
        valueType: "string",
        rules: [
            {
                type: "required",
                messageKey: "validation.required"
            },
            {
                type: "phone",
                messageKey: "validation.phone"
            }
        ]
    },
    contactMethod: {
        defaultValue: "",
        valueType: "string",
        rules: [
            {
                type: "required",
                messageKey: "validation.selectOne"
            }
        ]
    }
};
