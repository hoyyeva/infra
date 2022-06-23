package server

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"os"
	"sync"

	"github.com/infrahq/secrets"
	"go.uber.org/zap"
	"golang.org/x/crypto/acme/autocert"

	"github.com/infrahq/infra/internal/certs"
	"github.com/infrahq/infra/internal/logging"
)

func tlsConfigFromOptions(
	storage map[string]secrets.SecretStorage,
	tlsCacheDir string,
	opts TLSOptions,
) (*tls.Config, error) {
	// TODO: how can we test this?
	if opts.ACME {
		if err := os.MkdirAll(tlsCacheDir, 0o700); err != nil {
			return nil, fmt.Errorf("create tls cache: %w", err)
		}

		manager := &autocert.Manager{
			Prompt: autocert.AcceptTOS,
			Cache:  autocert.DirCache(tlsCacheDir),
			// TODO: according to the docs HostPolicy should be set to prevent
			// a DoS attack on certificate requests.
		}
		tlsConfig := manager.TLSConfig()
		tlsConfig.MinVersion = tls.VersionTLS12
		return tlsConfig, nil
	}

	// TODO: print CA fingerprint when the client can trust that fingerprint

	roots, err := x509.SystemCertPool()
	if err != nil {
		logging.S.Warnf("failed to load TLS roots from system: %v", err)
		roots = x509.NewCertPool()
	}

	if opts.CA != "" {
		if !roots.AppendCertsFromPEM([]byte(opts.CA)) {
			logging.S.Warnf("failed to load TLS CA, invalid PEM")
		}
	}

	cfg := &tls.Config{
		MinVersion: tls.VersionTLS12,
		// enable HTTP/2
		NextProtos: []string{"h2", "http/1.1"},
		// enabled optional mTLS
		ClientAuth: tls.VerifyClientCertIfGiven,
		ClientCAs:  roots,
	}

	if opts.Certificate != "" && opts.PrivateKey != "" {
		key, err := secrets.GetSecret(opts.PrivateKey, storage)
		if err != nil {
			return nil, fmt.Errorf("failed to load TLS private key: %w", err)
		}

		cert, err := tls.X509KeyPair([]byte(opts.Certificate), []byte(key))
		if err != nil {
			return nil, fmt.Errorf("failed to load TLS key pair: %w", err)
		}

		cfg.Certificates = []tls.Certificate{cert}
		return cfg, nil
	}

	if opts.CA == "" || opts.CAPrivateKey == "" {
		return nil, fmt.Errorf("either a TLS certificate and key or a TLS CA and key is required")
	}

	cfg.GetCertificate = getCertificate(autocert.DirCache(tlsCacheDir), opts)
	return cfg, nil
}

func getCertificate(cache autocert.Cache, opts TLSOptions) func(hello *tls.ClientHelloInfo) (*tls.Certificate, error) {
	var lock sync.RWMutex

	getKeyPair := func(ctx context.Context, serverName string) (cert, key []byte) {
		certBytes, err := cache.Get(ctx, serverName+".crt")
		if err != nil {
			logging.S.Warnf("cert: %s", err)
		}

		keyBytes, err := cache.Get(ctx, serverName+".key")
		if err != nil {
			logging.S.Warnf("key: %s", err)
		}
		return certBytes, keyBytes
	}

	return func(hello *tls.ClientHelloInfo) (*tls.Certificate, error) {
		ctx := hello.Context()
		serverName := hello.ServerName

		if serverName == "" {
			serverName = hello.Conn.LocalAddr().String()
		}

		lock.RLock()
		certBytes, keyBytes := getKeyPair(ctx, serverName)
		lock.RUnlock()

		// if either cert or key is missing, create it
		if certBytes == nil || keyBytes == nil {
			lock.Lock()
			// must check again after acquire
			certBytes, keyBytes := getKeyPair(ctx, serverName)
			if certBytes != nil && keyBytes != nil {
				keypair, err := tls.X509KeyPair(certBytes, keyBytes)
				lock.Unlock()
				if err != nil {
					return nil, err
				}
				return &keypair, nil
			}
			defer lock.Unlock()

			ca, err := tls.X509KeyPair([]byte(opts.CA), []byte(opts.CAPrivateKey))
			if err != nil {
				return nil, err
			}

			caCert, err := x509.ParseCertificate(ca.Certificate[0])
			if err != nil {
				return nil, err
			}

			certBytes, keyBytes, err = certs.GenerateCertificate([]string{serverName}, caCert, ca.PrivateKey)
			if err != nil {
				return nil, err
			}

			if err := cache.Put(ctx, serverName+".crt", certBytes); err != nil {
				return nil, err
			}

			if err := cache.Put(ctx, serverName+".key", keyBytes); err != nil {
				return nil, err
			}

			logging.L.Info("new server certificate",
				zap.String("Server name", serverName),
				zap.String("SHA256 fingerprint", certs.Fingerprint(pemDecode(certBytes))))
		}

		keypair, err := tls.X509KeyPair(certBytes, keyBytes)
		if err != nil {
			return nil, err
		}

		return &keypair, nil
	}
}

func pemDecode(raw []byte) []byte {
	block, _ := pem.Decode(raw)
	return block.Bytes
}
