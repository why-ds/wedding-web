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
    find "$destination/assets" -type f -printf '%P\n' > "$destination/.native-assets"
fi
[[ -f $destination/index.html && -d $destination/assets ]]
# Retain only assets originally built in the previous release, not its inherited history.
previous=$(readlink -f "$base/current" || true)
if [[ $previous != "$destination" && $previous == "$base/releases/"* && -d $previous/assets ]]; then
    if [[ -f $previous/.native-assets ]]; then
        while IFS= read -r asset; do
            [[ $asset != /* && $asset != *'..'* && -f $previous/assets/$asset ]] || exit 1
            mkdir -p -- "$destination/assets/$(dirname "$asset")"
            cp -an -- "$previous/assets/$asset" "$destination/assets/$asset"
        done < "$previous/.native-assets"
    else
        # One-time compatibility with releases created before the manifest existed.
        cp -an "$previous/assets/." "$destination/assets/"
    fi
fi
ln -sfn "$destination" "$base/current.next"
mv -Tf "$base/current.next" "$base/current"
python3 "$upload/prune-releases.py" "$base/releases" --protect "$release" --protect "${previous##*/}" || echo 'Release cleanup failed; inspect disk usage.' >&2
python3 "$upload/prune-releases.py" "$(dirname "$upload")" --protect "$release" --protect "${previous##*/}" || echo 'Upload cleanup failed; inspect disk usage.' >&2
echo "Web release $release activated."
