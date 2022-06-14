package validate

// Validate that the values in the struct are valid according to the validation rules.
// If validation fails the error will be of type Error.
func Validate(req Request) error {
	fieldErrors := make(map[string][]string)

	for _, rule := range req.ValidationRules() {
		if err := rule.validate(); err != nil {
			fieldErrors[rule.fieldName()] = append(fieldErrors[rule.fieldName()], err.Error())
		}
	}

	if len(fieldErrors) > 0 {
		return Error{FieldErrors: fieldErrors}
	}
	return nil
}

// RulesToMap creates a map of validation rules, where the key is
// the JSON field that the rules apply to.
func RulesToMap(req Request) (map[string][]ValidationRule, error) {
	result := make(map[string][]ValidationRule)
	for _, rule := range req.ValidationRules() {
		result[rule.fieldName()] = append(result[rule.fieldName()], rule)
	}
	return result, nil
}
