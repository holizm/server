# Server Setup (Production)

## 1. Operating System

* Debian Trixie
  [https://www.debian.org/releases/trixie/](https://www.debian.org/releases/trixie/)

---

## 2. Initial Access

* Log in as `root`
* Change root password:

  ```bash
  passwd root
  ```

---

## 3. Create Admin User (Recommended)

> ⚠️ Do not close the current SSH session until everything is tested from a second session.

* Create a new admin user (lowercase, strong, ~20 chars recommended):

  ```bash
  adduser new-admin-username
  ```
* Grant sudo privileges:

  ```bash
  usermod -aG sudo new-admin-username
  ```
* Set up SSH access:

  ```bash
  ssh-copy-id new-admin-username@server-ip
  ```
* Ensure passwordless sudo (optional, configure via `/etc/sudoers` or `/etc/sudoers.d/`)

---

## 4. Disable Root Login (after verification)

* Make sure the new user works first.
* Then disable root SSH login in:

  ```bash
  nano /etc/ssh/sshd_config
  ```

  Set:

  ```
  PermitRootLogin no
  ```

---

## 5. Change SSH Port

> ⚠️ Keep the current session open and test a second session before closing anything.

* Edit SSH config:

  ```bash
  nano /etc/ssh/sshd_config
  ```
* Change:

  ```
  Port <new-port>
  ```
* Restart SSH:

  ```bash
  systemctl restart ssh
  ```

---

## 6. Fix Directory Ownership (if needed)

```bash
sudo chown -R $(whoami):$(whoami) /HolismHolding
sudo chown -R $(whoami):$(whoami) /Instance
```

---

## 7. Set Hostname

* Change hostname:

  ```bash
  sudo hostnamectl set-hostname new-hostname
  ```
* Update `/etc/hosts`:

  ```
  127.0.1.1   new-hostname
  ```
* Reboot:

  ```bash
  sudo reboot
  ```

> Naming convention suggestion:
> `<owner-name>-001`, `<owner-name>-002`, etc.

---

## 8. DNS / Nameservers (Optional)

* Edit:

  ```bash
  nano /etc/resolv.conf
  ```

> Note: This file may be overwritten by system services (use systemd-resolved if persistent config is needed).

---

## 9. NGINX Setup

⚠️ Important:

* Do NOT move `/etc/nginx/sites-available/`

* Only manage `sites-enabled` or use symlinks carefully.

* Create symlink:

  ```bash
  sudo ln -s -f /HolismHolding/Server/Nginx/Default /etc/nginx/conf.d/default.conf
  ```

* Reload NGINX:

  ```bash
  sudo nginx -s reload
  ```

---

## 10. Docker Login

```bash
docker login
docker login ghcr.io
```

---

## 11. CPU Feature Check (SSE4.2)

Required for UBI9 / Keycloak:

```bash
cat /proc/cpuinfo | grep sse4
```

---

## 12. Security Checklist

* Enable firewall (allow only required ports):

  * HTTP (80)
  * HTTPS (443)
  * SSH (custom port)
* Install and configure `fail2ban`
* Disable root SSH login
* Use SSH key authentication only
* Restrict database access (VPN-only exposure)

---

If you want, I can also turn this into a **fully automated bootstrap script** or a **production hardening checklist with verification steps**.
