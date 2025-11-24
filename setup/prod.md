# Server setup

- OS
    - Debian Trixie
        - https://www.debian.org/releases/trixie/
- Sing-in with root
- Change root password
    - `passwd root`
- Change ssh port
    - It's important not to close the current SSH connection, and from another tab, test the results to make sure you won't be locked out of the server.
    - Use the `hardenedSshConfig`
    - `micro /etc/ssh/sshd_config`
    - `systemctl restart ssh`
- Rename hostname
    - `sudo hostnamectl set-hostname new-hostname`
    - `/etc/hosts`
        - `127.0.1.1    new-hostname`
    - `sudo reboot`
    - It's better to get the name of the server from the name of the owner, and then add 001, 002, etc to the end of it.

- NGINX
    - IMPORTANT NOTE => Only move /etc/webServer/sites-enabled/ and DO NOT MOVE /etc/webServer/sites-available/ because it's a symbolic link to that.
    - Run
        - `sudo ln -s -f /HolismHolding/Server/webServer/Default /etc/webServer/conf.d/default.conf`
        - `sudo nginx -s reload`

- `docker login`
- `docker login ghcr.io`

- Make sure SSE4.2 is supported (For UBI9 for Keycloak)
    - `cat /proc/cpunifo | grep sse4`

- Security
    - Use a firewall to only allow certain ports
        - HTTP + HTTPS + SSH + ...
    - Set up fail2ban to block IPs that try too many failed login attempts
    - Expose database only via VPN
