export const isValidUTCFormat = (input) => {
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    return iso8601Regex.test(input);
};

export const isValidISO8601DateFormat = (input) => {
    const iso8601DateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return iso8601DateRegex.test(input);
};
