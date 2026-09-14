#!/usr/bin/env bash
set -Eeuo pipefail
umask 022
release=${1:?Missing commit SHA}
[[ $release =~ ^[0-9a-f]{40}$ ]] || exit 1
upload=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
cd "$upload"
sha256sum --check web.tar.gz.sha256
base=/var/www/wedding-web
exec 9>"$base/.deploy.lock"
flock -w 180 9
destination="$base/releases/$release"
if [[ -e $destination ]]; then
    cmp --silent web.tar.gz.sha256 "$destination/.artifact-sha256" || { echo 'Existing release has different content.' >&2; exit 1; }
else
    mkdir -m 0755 "$destination"
    tar --extract --gzip --file web.tar.gz --directory "$destination" --no-same-owner --no-same-permissions
    cp web.tar.gz.sha256 "$destination/.artifact-sha256"
fi
[[ -f $destination/index.html && -d $destination/assets ]]
# Keep hashed assets referenced by already open browser pages after the switch.
previous=$(readlink -f "$base/current" || true)
if [[ $previous != "$destination" && $previous == "$base/releases/"* && -d $previous/assets ]]; then
    cp -an "$previous/assets/." "$destination/assets/"
fi
ln -sfn "$destination" "$base/current.next"
mv -Tf "$base/current.next" "$base/current"
echo "Web release $release activated."
