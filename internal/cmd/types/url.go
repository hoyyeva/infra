package types

import (
	"fmt"
	"net/url"

	"github.com/goware/urlx"
)

// URL is an alias for url.URL that allows it to be parsed from a command line
// flag, or config file. URLs without a scheme default to https.
type URL url.URL

func (u *URL) Set(raw string) error {
	v, err := urlx.ParseWithDefaultScheme(raw, "https")
	if err != nil {
		return err
	}
	*u = URL(*v)
	return nil
}

func (u *URL) String() string {
	if u == nil {
		return ""
	}
	return (*url.URL)(u).String()
}

func (u *URL) Type() string {
	return "url"
}

func (u *URL) Value() *url.URL {
	return (*url.URL)(u)
}

// WriteAnswer is used by the survey library to populate a value from the user.
func (u *URL) WriteAnswer(field string, raw interface{}) error {
	s, ok := raw.(string)
	if !ok {
		return fmt.Errorf("url for %v must be a string", field)
	}
	return u.Set(s)
}
