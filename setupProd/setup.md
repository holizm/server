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

## 2. Harden/Secure SSH

> ⚠️ Do not close the current SSH session until everything is tested from a second session.
> ⚠️ Choose a random port from the private/ephemeral range (49152–65535)

- Identify the provider-defined account used to set up the VPS. It may be `root`, `debian`, or another account.
- Install `dev`'s public SSH key for the setup account and `root`.
- Verify key authentication on the current SSH port.
- Choose a random port and replace the `Port` value in:

```text
/home/dev/server/setupProd/hardenedSshConfig
```

- Copy the configuration to:

```text
/etc/ssh/sshd_config
```

- Validate the configuration before restarting SSH:

```bash
sshd -t
```

- Restart SSH while keeping the current session open:

```bash
systemctl restart ssh
```

- Open a second connection using the key and new port.
- Verify root and setup-account access using public keys.
- Verify that password authentication is disabled before closing the original session.
- Do not grant sudo access to non-root server users.
- Reconnect as `root` and use that connection for every subsequent setup step:

```bash
ssh -p sshPort root@serverIp
```

---

## 3. Set Hostname

* Change hostname:

```bash
hostnamectl set-hostname new-hostname
```

* In `/etc/hosts`, remove every existing line that starts with `127.0.1.1`, including mappings containing the provider's stale hostname.
* Add exactly one `127.0.1.1` mapping for the new hostname:

```text
127.0.1.1   new-hostname
```

* If cloud-init manages the server, set `preserve_hostname: true` in `/etc/cloud/cloud.cfg`.

* Reboot:

```bash
reboot
```

* Reconnect and verify the hostname with `hostnamectl --static`.
* Confirm that `/etc/hosts` still contains exactly one `127.0.1.1` mapping and that it contains only the new hostname.

> Naming convention suggestion:
> `<owner-name>-001`, `<owner-name>-002`, etc.

---

## 4. Clone Holism Repositories

Perform this step as `root`. Create the shared platform directory and clone only the shared Holism repositories.

```bash
mkdir -p /holism
git clone https://github.com/holizm/accounts /holism/accounts
git clone https://github.com/holizm/fonts /holism/fonts
git clone https://github.com/holizm/server /holism/server
```

---

## 5. Docker Login

```bash
docker login
docker login ghcr.io
```

---

## 6. CPU Feature Check (SSE4.2)

Required for UBI9 / Keycloak:

```bash
cat /proc/cpuinfo | grep sse4
```

---

## 7. Security Checklist

* Enable firewall (allow only required ports):

  * HTTP (80)
  * HTTPS (443)
  * SSH (custom port)
* Install and configure `fail2ban`
* Allow root SSH login only by public key
* Use SSH key authentication only
* Do not grant sudo access to non-root server users
* Restrict database access (VPN-only exposure)

---

## 8. Change root password

* Log in as `root`
* Change root password:

```bash
passwd root
```

---
