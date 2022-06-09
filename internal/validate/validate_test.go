package validate

import (
	"errors"
	"testing"

	gocmp "github.com/google/go-cmp/cmp"
	"gotest.tools/v3/assert"
)

type ExampleRequest struct {
	RequiredString string `json:"strOne"`
	SubNested      Sub    `json:"subNested"`
	Sub                   // sub embedded
}

type Sub struct {
	FieldOne string `json:"fieldOne"`
}

func (r *ExampleRequest) ValidationRules() []ValidationRule {
	return []ValidationRule{
		Required("strOne", r.RequiredString),
		&StringRule{
			Value:     r.RequiredString,
			Name:      "strOne",
			MinLength: 2,
			MaxLength: 10,
		},
		Required("fieldOne", r.Sub.FieldOne),
		&StringRule{
			Value:     r.SubNested.FieldOne,
			Name:      "subNested.fieldOne",
			MaxLength: 10,
		},
	}
}

func TestValidate_Success(t *testing.T) {
	r := &ExampleRequest{
		RequiredString: "not-zero",
		Sub:            Sub{FieldOne: "not-zero2"},
	}
	err := Validate(r)
	assert.NilError(t, err)
}

func TestValidate_Failed(t *testing.T) {
	r := &ExampleRequest{
		RequiredString: "",
		SubNested: Sub{
			FieldOne: "abcdefghijklmnopqrst",
		},
	}
	err := Validate(r)
	assert.ErrorContains(t, err, "validation failed: ")

	var fieldError Error
	assert.Assert(t, errors.As(err, &fieldError))
	expected := Error{
		FieldErrors: map[string][]string{
			"fieldOne":           {"a value is required"},
			"strOne":             {"a value is required"},
			"subNested.fieldOne": {"length (20) must be no more than 10"},
		},
	}
	assert.DeepEqual(t, fieldError, expected)
}

func TestRulesToMap(t *testing.T) {
	r := &ExampleRequest{}
	list := r.ValidationRules()
	rules, err := RulesToMap(r)
	assert.NilError(t, err)
	expected := map[string][]ValidationRule{
		"strOne":             {list[0], list[1]},
		"fieldOne":           {list[2]},
		"subNested.fieldOne": {list[3]},
	}
	assert.DeepEqual(t, rules, expected, cmpValidationRules)
}

var cmpValidationRules = gocmp.Options{
	gocmp.AllowUnexported(requiredRule{}),
}
