# Server Setup (Production)

## 1. Operating System

* Debian Trixie
  [https://cdimage.debian.org/debian-cd/current/amd64/iso-cd/debian-13.4.0-amd64-netinst.iso](https://www.debian.org/releases/trixie/)

---

## 2. System Update

```bash
apt update && apt upgrade -y
```

---

## 3. Change root password

* Log in as `root`
* Change root password:

```bash
passwd root
```

---

## 4. Harden/Secure SSH

> ⚠️ Do not close the current SSH session until everything is tested from a second session.
> ⚠️ Choose a random port from the private/ephemeral range (49152–65535)

* Copy this file:

```text
/home/dev/server/setupProd/hardenedSshConfig
```

* To:

```text
/etc/ssh/sshd_config
```

* Then run:

```bash
systemctl restart ssh
```
---

## 5. Set Hostname

* Change hostname:

```bash
hostnamectl set-hostname new-hostname
```

* Update `/etc/hosts`:

```text
127.0.1.1   new-hostname
```

* Reboot:

```bash
reboot
```

> Naming convention suggestion:
> `<owner-name>-001`, `<owner-name>-002`, etc.

---

## 6. DNS / Nameservers (Optional)

* Edit:

```bash
nano /etc/resolv.conf
```

> Note: This file may be overwritten by system services (use systemd-resolved if persistent config is needed).

---

## 8. Docker Login

```bash
docker login
docker login ghcr.io
```

---

## 9. CPU Feature Check (SSE4.2)

Required for UBI9 / Keycloak:

```bash
cat /proc/cpuinfo | grep sse4
```

---

## 11. Security Checklist

* Enable firewall (allow only required ports):

  * HTTP (80)
  * HTTPS (443)
  * SSH (custom port)
* Install and configure `fail2ban`
* Disable root SSH login
* Use SSH key authentication only
* Restrict database access (VPN-only exposure)

---
