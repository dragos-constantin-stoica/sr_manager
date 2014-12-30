#!/bin/bash
VERSION="v0.3"

rm *.zip; zip -r srm_$VERSION.zip loreal_app manifest.json -x "*/\.DS_Store*"