#!/bin/env bash

set -e

# switch to the project dir where this script is located, just in case
# TODO: this is a temporary measure
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir"

# check if git worktree is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "Git tree not clean! Aborting"
    exit 1
fi

echo "Running style checks (silently)..."
npm run format:check >/dev/null 2>/dev/null
echo "Running type checks (silently)..."
npm run checks >/dev/null 2>/dev/null
echo "Running tests (silently)..."
npm run tests >/dev/null 2>/dev/null

package_name="${1}"
package_path=$(npm query ".workspace[name=\"$package_name\"]" | jq -r '.[0].realpath // ""')

if [ -z "${package_path}" ]; then
    echo "could not find package"
    exit 1
fi

package_version="$(jq -r '.version' ${package_path}/package.json)"

if [[ "$package_version" == *-* ]]; then
    npm_tag="${package_version#*-}" # e.g. `pre.1`
    npm_tag="${npm_tag%%.*}"        # e.g. `pre`
else
    npm_tag="latest"
fi

new_git_tag="${package_name}@${package_version}"

# check if a git tag exists for the current version
existing_tag_commit_id=$(git rev-parse -q --verify "refs/tags/$new_git_tag^{commit}") || true

if [ -n "$existing_tag_commit_id" ]; then
    echo "Commit \`${existing_tag_commit_id}\` is already tagged with \`${new_git_tag}\`..."
    if [ "$existing_tag_commit_id" = "$(git rev-parse HEAD)" ]; then
        echo "...but it points at \`HEAD\` so we're good."
    else
        echo "...and you're trying to publish from a different one."
        exit 1
    fi
else
    echo "Tagging \`HEAD\` as \`${new_git_tag}\`"
    git tag $new_git_tag
fi

# check if the current version is already published or not
set +e
npm_check_result=$(npm view "${new_git_tag}" version 2>&1) || true
set -e

case "$npm_check_result" in
# npm view returned a version, which means it's already published, halt
"$package_version") echo "\`${new_git_tag}\` already published!" && exit 0 ;;
# E404 means the package doesn't exist, this is the expected result, continue
*E404*) ;;
# probably a network error, or some CLI or API changed, halt
*) echo "Something went wrong with the npm version check: \`${npm_check_result}\`." && exit 1 ;;
esac

# time to switch to the package directory
cd "${package_path}"

echo "All checks seem fine, publishing \`${new_git_tag}\`."

echo "Running a fresh build..."
npm run build

# Note: Staged publishing requires npm CLI version 11.15.0 or later and Node version 22.14.0 or higher.
npm stage publish --tag="${npm_tag}"
