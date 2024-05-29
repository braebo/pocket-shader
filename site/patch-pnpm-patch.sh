#!/usr/bin/env bash

# Read package.json and loop over the `pnpm.patchedDependencies`
# object (all package names and version numbers) to find any
# patches that do not match against the `dependencies` or
# `devDependencies`.
#
# Example package.json:
#
# ```json
# {
#   "dependencies": {
#     "vite": "4.4.9"
#   },
#   "devDependencies": {
#     "@crxjs/vite-plugin": "2.0.0-beta.18"
#   }
#   "pnpm": {
#     "patchedDependencies": {
#       "vite@4.4.2": "patches/vite@4.4.2.patch",
#       "@crxjs/vite-plugin@2.0.0-beta.17": "patches/@crxjs__vite-plugin@2.0.0-beta.17.patch"
#     }
#   }
# }
# ```
#
# Update any non-matching patches data and files as follows:
#
# 1. Remove the existing property from `pnpm.patchedDependencies`
# 2. Add a new property to `pnpm.patchedDependencies` with the
#    updated version number
# 3. Move the patch file to the new version number
# 4. Update the pnpm lockfile with pnpm install
#
# This is necessary because pnpm does not apply patches to
# higher version numbers on its own (like patch-package does)
# https://github.com/pnpm/pnpm/issues/5686#issuecomment-1527221879

yq eval '.pnpm.patchedDependencies | with_entries(select(.key | test(".*@.*"))) | to_entries | .[] | .key + " " + .value' package.json | while read -r patched_dependency; do
  # Get the package name and version number
  #
  # Example patched_dependency:
  #
  # ```
  # "@crxjs/vite-plugin@2.0.0-beta.17 patches/@crxjs__vite-plugin@2.0.0-beta.17.patch"
  # ```

  # Extract key: `@crxjs/vite-plugin@2.0.0-beta.17`
  package_name_and_version=$(echo "$patched_dependency" | sed -E 's/"(.*) .*/\1/')

  # Strip from last `@` symbol to end of string: `@crxjs/vite-plugin`
  package_name="${package_name_and_version%@*}"

  # Strip from start of string to last `@` symbol: `2.0.0-beta.17`
  package_version="${package_name_and_version##*@}"

  # Extract value: `patches/@crxjs__vite-plugin@2.0.0-beta.17.patch`
  patch_path=$(echo "$patched_dependency" | sed -E 's/.* (.*)"/\1/')

  # Get the package version number from the `dependencies` or
  # `devDependencies` object
  package_version_from_dependencies=$(yq eval --output-format=yaml ".dependencies.$package_name // .devDependencies.$package_name" package.json)

  # If the package version number from the `dependencies` or
  # `devDependencies` object does not match the package version
  # number from the `pnpm.patchedDependencies` object, then
  # update the patch version number
  if [ "$package_version_from_dependencies" != "$package_version" ]; then
    echo "Updating pnpm patch: $package_name@$package_version to $package_name@$package_version_from_dependencies"

    yq --inplace --output-format=json eval "del(.pnpm.patchedDependencies.\"$package_name_and_version\")" package.json

    # Update patch_path to version from package_version_from_dependencies
    # Before: "patches/@vitejs__plugin-react@4.0.0.patch"
    # After: "patches/@vitejs__plugin-react@4.0.4.patch"
    new_patch_path=$(echo "$patch_path" | sed -E "s/@$package_version\.patch/@$package_version_from_dependencies.patch/")

    yq --inplace --output-format=json eval ".pnpm.patchedDependencies += {\"$package_name@$package_version_from_dependencies\": \"$new_patch_path\"}" package.json
    mv "$patch_path" "$new_patch_path"
  fi
done

# Update pnpm-lock.yaml
pnpm install --no-frozen-lockfile