#!/bin/sh
set -e
# Bind-mounted ./backend on the host sometimes leaves ./media owned by root (e.g. after a
# mistaken sudo); the app runs as uid 1000 and cannot mkdir user_backgrounds/ without this.
mkdir -p /app/media
if ! chown -R appuser:appuser /app/media 2>/dev/null; then
  echo "tagly: WARNING: could not chown /app/media to appuser; background uploads may fail" >&2
fi
exec gosu appuser "$@"
