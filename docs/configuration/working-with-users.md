---
title: Working with Users
position: 3
---

# Working with Users

## Listing users

To see all users being managed by Infra, use `infra users list`:

```
infra users list
```

You'll see the resulting list of users:

```
NAME                         LAST SEEN
fisher@infrahq.com           just now
jeff@infrahq.com             5 mintues ago
matt.williams@infrahq.com    3 days ago
michael@infrahq.com          3 days ago
```

## Adding a user

To add a user to Infra, use `infra users add`:

```
infra users add example@acme.com
```

You'll be provided a temporary password to share with the user (via slack, eamil or similar) they should use when running `infra login`.

## Removing a user

```
infra users remove example@acme.com
```

## Resetting a user's password

```
infra users edit example@acme.com --password
```
