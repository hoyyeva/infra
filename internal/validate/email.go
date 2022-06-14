package validate

import (
	"fmt"
	"net/mail"

	"github.com/getkin/kin-openapi/openapi3"
)

func Email(name string, value string) ValidationRule {
	return email{name: name, value: value}
}

type email struct {
	name  string
	value string
}

func (e email) validate() error {
	if e.value == "" {
		return nil
	}
	addr, err := mail.ParseAddress(e.value)
	if err != nil {
		return fmt.Errorf("invalid email address")
	}
	if addr.Name != "" {
		return fmt.Errorf("email address can must not contain a name")
	}
	return nil
}

func (e email) DescribeSchema(schema *openapi3.Schema) {
	schema.Format = "email"
}

func (e email) fieldName() string {
	return e.name
}
