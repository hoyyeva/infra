package validate

import (
	"fmt"
	"reflect"
	"strings"

	"github.com/getkin/kin-openapi/openapi3"
)

type ValidationRule interface {
	validate() error

	DescribeSchema(schema *openapi3.Schema)
	fieldName() string
}

// Request is implemented by all request structs
type Request interface {
	ValidationRules() []ValidationRule
}

type Error struct {
	FieldErrors map[string][]string
}

func (e Error) Error() string {
	var buf strings.Builder
	buf.WriteString("validation failed: ")
	i := 0
	for k, v := range e.FieldErrors {
		if i != 0 {
			buf.WriteString("; ")
		}
		i++
		buf.WriteString(k + ": " + strings.Join(v, ", "))
	}
	return buf.String()
}

type requiredRule struct {
	name  string
	value any
}

// Required checks that the value does not have a zero value.
// Zero values are nil, "", 0, and false.
// Name is the name of the field as visible to the user, often the json field
// name.
func Required(name string, value any) ValidationRule {
	return requiredRule{name: name, value: value}
}

func (r requiredRule) DescribeSchema(*openapi3.Schema) {
}

func (r requiredRule) IsRequired() bool {
	return true
}

func (r requiredRule) validate() error {
	// value is always a non-nil pointer, so indirect it
	if !reflect.ValueOf(r.value).IsZero() {
		return nil
	}
	return fmt.Errorf("a value is required")
}

func (r requiredRule) fieldName() string {
	return r.name
}

// IsRequired returns true if any of the rules indicate the value of the field is
// required.
func IsRequired(rules ...ValidationRule) bool {
	for _, rule := range rules {
		required, ok := rule.(isRequired)
		return ok && required.IsRequired()
	}
	return false
}

type isRequired interface {
	IsRequired() bool
}

// Field is used to construct validation rules that incorporate multiple fields.
type Field struct {
	Name  string
	Value interface{}
}

// MutuallyExclusive returns a validation rule that checks that only one of the
// fields is set to a non-zero value.
func MutuallyExclusive(fields ...Field) ValidationRule {
	return mutuallyExclusive(fields)
}

type mutuallyExclusive []Field

func (m mutuallyExclusive) validate() error {
	var nonZero []string
	for _, field := range m {
		if !reflect.ValueOf(field).IsZero() {
			nonZero = append(nonZero, field.Name)
		}
	}

	if len(nonZero) > 1 {
		return fmt.Errorf("only one of %v can be set", strings.Join(nonZero, ", "))
	}
	return nil
}

func (m mutuallyExclusive) DescribeSchema(_ *openapi3.Schema) {}

func (m mutuallyExclusive) fieldName() string {
	return ""
}

func RequireOneOf(fields ...Field) ValidationRule {
	return requireOneOf(fields)
}

type requireOneOf []Field

func (m requireOneOf) validate() error {
	var zero []string
	for _, field := range m {
		if reflect.ValueOf(field).IsZero() {
			zero = append(zero, field.Name)
		}
	}

	if len(zero) == 0 {
		return fmt.Errorf("one of %v must be set", strings.Join(zero, ", "))
	}
	return nil
}

func (m requireOneOf) DescribeSchema(_ *openapi3.Schema) {}

func (m requireOneOf) fieldName() string {
	return ""
}
