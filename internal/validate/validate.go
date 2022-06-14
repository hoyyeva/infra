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

// TODO: requiredWithout
// TODO: mutuallyExclusive

// MutuallyExclusive returns a validation rule that checks that only one of the
// fields is set to a non-zero value.
func MutuallyExclusive(
	nameA string, valueA interface{},
	nameB string, valueB interface{},
) ValidationRule {
	return mutuallyExclusive{
		nameA:  nameA,
		valueA: valueA,
		nameB:  nameB,
		valueB: valueB,
	}
}

type mutuallyExclusive struct {
	nameA  string
	valueA interface{}
	nameB  string
	valueB interface{}
}

func (m mutuallyExclusive) validate() error {
	if reflect.ValueOf(m.valueA).IsZero() || reflect.ValueOf(m.valueB).IsZero() {
		return nil
	}
	return fmt.Errorf("only one of %v and %v can be set", m.nameA, m.nameB)
}

func (m mutuallyExclusive) DescribeSchema(schema *openapi3.Schema) {
}

func (m mutuallyExclusive) fieldName() string {
	return m.nameA
}
