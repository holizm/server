# Server Setup (Production)

## 1. Operating System

- Connect to the server over SSH before performing any setup.
- Read `/etc/os-release` and verify that the server runs the latest Debian stable release with an announced LTS lifecycle.
- The current required release is Debian 13 (Trixie):
  [Debian stable release information](https://www.debian.org/releases/stable/)
- If the server runs an older Debian release, upgrade one major release at a time by following the official release notes. Reboot, reconnect, and verify `/etc/os-release` before continuing.
- If the server does not run Debian, reinstall it with the current Debian stable installer before continuing:
  [Debian stable installer](https://www.debian.org/distrib/)

```bash
apt update && apt full-upgrade -y
reboot
```

Reconnect after the reboot and confirm that no further upgrades are pending before continuing.

---

## 2. Change root password

* Log in as `root`
* Change root password:

```bash
passwd root
```

---

## 3. Harden/Secure SSH

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

* Then make sure SSH config is correct (no log should be printed)

```bash
sshd -t
```

* Then run:

```bash
systemctl restart ssh
```
---

## 4. Set Hostname

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

## 5. DNS / Nameservers (Optional)

* Edit:

```bash
nano /etc/resolv.conf
```

> Note: This file may be overwritten by system services (use systemd-resolved if persistent config is needed).

---

## 6. Docker Login

```bash
docker login
docker login ghcr.io
```

---

## 7. CPU Feature Check (SSE4.2)

Required for UBI9 / Keycloak:

```bash
cat /proc/cpuinfo | grep sse4
```

---

## 8. Security Checklist

* Enable firewall (allow only required ports):

  * HTTP (80)
  * HTTPS (443)
  * SSH (custom port)
* Install and configure `fail2ban`
* Disable root SSH login
* Use SSH key authentication only
* Restrict database access (VPN-only exposure)

---
