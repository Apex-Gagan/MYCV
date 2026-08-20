from whitenoise.storage import CompressedManifestStaticFilesStorage


class ResilientStaticFilesStorage(CompressedManifestStaticFilesStorage):
    """Hashed + pre-compressed static files that degrade instead of 500-ing.

    Project image paths come out of the database, so they are not guaranteed to
    match a manifest key. With the default `manifest_strict = True` a single
    stale row raises mid-render and takes the whole page down; here a miss falls
    back to the un-hashed URL, which at worst 404s one image.
    """

    manifest_strict = False
