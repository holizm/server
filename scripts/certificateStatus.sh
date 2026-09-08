healthyCertificates=()
expiredCertificates=()
brokenCertificates=()

loadCertificateStatus() {
    healthyCertificates=()
    expiredCertificates=()
    brokenCertificates=()

    while IFS= read -r domain; do
        certificatePath="/etc/letsencrypt/live/$domain/fullchain.pem"
        if [[ ! -f "$certificatePath" ]] || ! openssl x509 -in "$certificatePath" -noout >/dev/null 2>&1; then
            brokenCertificates+=("$domain")
        elif ! openssl x509 -in "$certificatePath" -noout -checkend 0 >/dev/null 2>&1; then
            expiredCertificates+=("$domain")
        else
            healthyCertificates+=("$domain")
        fi
    done < <(
        {
            certbot certificates 2>/dev/null | sed -n 's/^  Certificate Name: //p'
            find /etc/letsencrypt/archive /etc/letsencrypt/live -mindepth 1 -maxdepth 1 -type d -printf '%f\n' 2>/dev/null
            find /etc/letsencrypt/renewal -mindepth 1 -maxdepth 1 -type f -name '*.conf' -printf '%f\n' 2>/dev/null | sed 's/\.conf$//'
        } | sort -u
    )
}
