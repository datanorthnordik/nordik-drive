#!/bin/sh
set -eu

API_ORIGIN_VALUE=$(printf '%s' "${API_ORIGIN:-}" | sed 's:/*$::')

if [ -z "${API_ORIGIN_VALUE}" ]; then
  echo >&2 "API_ORIGIN environment variable is required."
  exit 1
fi

export API_ORIGIN="${API_ORIGIN_VALUE}"

envsubst '${API_ORIGIN}' \
  < /etc/nginx/custom/default.conf.template \
  > /etc/nginx/conf.d/default.conf

ESCAPED_API_ORIGIN=$(printf '%s' "${API_ORIGIN}" | sed 's/\\/\\\\/g; s/"/\\"/g')

cat > /usr/share/nginx/html/runtime-config.js <<EOF
window.__APP_CONFIG__ = Object.assign(window.__APP_CONFIG__ || {}, {
  API_ORIGIN: "${ESCAPED_API_ORIGIN}"
});
EOF
