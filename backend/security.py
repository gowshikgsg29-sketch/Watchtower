import os
import socket
import ipaddress
import urllib.parse
from typing import Tuple

BLOCKED_HOSTNAMES = {
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "host.docker.internal",
    "metadata.google.internal",
    "instance-data",
}

BLOCKED_TLDS = {
    ".local",
    ".internal",
    ".lan",
    ".localhost",
}

def is_safe_public_url(url_str: str) -> Tuple[bool, str]:
    """
    Validates that a URL is a valid, publicly reachable HTTP/HTTPS destination.
    Rejects private IPs, loopbacks, internal hostnames, and metadata endpoints (SSRF Prevention).
    """
    if not url_str or not isinstance(url_str, str):
        return False, "Target URL is required."

    url_str = url_str.strip()

    # Parse URL
    try:
        parsed = urllib.parse.urlparse(url_str)
    except Exception as e:
        return False, f"Invalid URL structure: {e}"

    if parsed.scheme.lower() not in ("http", "https"):
        return False, f"Unsupported scheme '{parsed.scheme}'. Only HTTP and HTTPS are permitted."

    hostname = parsed.hostname
    if not hostname:
        return False, "URL must contain a valid domain name or public IP address."

    hostname_lower = hostname.lower()
        # Development-only exception for the Watchtower test page.
    if (
        os.getenv("WATCHTOWER_ALLOW_LOCAL_TEST") == "1"
        and parsed.scheme.lower() == "http"
        and hostname_lower == "127.0.0.1"
        and parsed.port == 9000
        and parsed.path == "/watchtower-test.html"
        and not parsed.username
        and not parsed.password
        and not parsed.query
        and not parsed.fragment
    ):
        return True, "Allowed exact local test page in development mode."

    # Check direct blocked hostnames
    if hostname_lower in BLOCKED_HOSTNAMES:
        return False, f"Access to '{hostname}' is blocked for security (SSRF prevention)."

    for tld in BLOCKED_TLDS:
        if hostname_lower.endswith(tld):
            return False, f"Access to private domain '{hostname}' is blocked."

    # Prevent cloud metadata IP directly
    if hostname_lower == "169.254.169.254":
        return False, "Access to cloud metadata IP is blocked."

    # Resolve domain to IP addresses and inspect each IP
    try:
        addr_infos = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
    except socket.gaierror:
        return False, f"Could not resolve domain '{hostname}'. Please ensure the domain exists and is reachable."
    except Exception as e:
        return False, f"DNS resolution failed: {e}"

    if not addr_infos:
        return False, f"No IP addresses found for '{hostname}'."

    for family, socktype, proto, canonname, sockaddr in addr_infos:
        ip_str = sockaddr[0]
        try:
            ip_obj = ipaddress.ip_address(ip_str)

            if ip_obj.is_loopback:
                return False, f"Domain resolves to loopback IP '{ip_str}', which is prohibited."
            if ip_obj.is_private:
                return False, f"Domain resolves to private IP '{ip_str}', which is prohibited."
            if ip_obj.is_link_local:
                return False, f"Domain resolves to link-local IP '{ip_str}', which is prohibited."
            if ip_obj.is_multicast:
                return False, f"Domain resolves to multicast IP '{ip_str}', which is prohibited."
            if ip_obj.is_reserved:
                return False, f"Domain resolves to reserved IP '{ip_str}', which is prohibited."
            if ip_obj.is_unspecified:
                return False, f"Domain resolves to unspecified IP '{ip_str}', which is prohibited."
        except ValueError:
            return False, f"Invalid IP address returned: '{ip_str}'."

    return True, "URL is a valid public destination."
