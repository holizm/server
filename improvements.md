Highest-priority findings:

  1. Rootless Docker is not active. The setup installs one system-wide Docker daemon; the per-user rootless configuration is commented out in setupProd/
     setup:149. Each user should instead get a dedicated rootless Docker daemon managed by a user-level systemd service.

  2. Shared permissions create a privilege-escalation risk. Every tenant user joins shared and www-data in setupProd/secureUsers.sh:35, while /holism/server is
     group-writable in setupProd/setPermissions.sh:9. A user could replace code that is later executed by root. Platform code should be root-owned and non-
     writable by tenant users.

  3. Deployment failures are routinely swallowed. runOnTerminal (scripts/terminal.js:17) returns an empty string by default when a command fails. Setup and
     deployment commands can therefore report success after partial failure. Mutating operations should fail by default.

  4. Global pruning should be removed. commands/start:103 runs docker system prune during ordinary startup. On a shared daemon, this affects the entire server;
     even with rootless Docker, it unnecessarily destroys each user’s build cache.

  5. The restart command is currently broken. commands/restart:9 redeclares its params parameter and references an undefined composeFile. It cannot parse
     successfully.

  6. Port allocation is unsafe. scripts/getDeterministicPort.js:15 selects ports from Linux’s ephemeral outbound-port range without collision detection. Caddy
     needs a persistent, validated mapping of deployment/process to loopback port.

  7. Container hardening is inconsistent. The API drops capabilities and uses a read-only filesystem, but composes/site:1 does not. Mongo uses the mutable
     latest tag and may expose port 27017 beyond loopback in composes/databases:3.
