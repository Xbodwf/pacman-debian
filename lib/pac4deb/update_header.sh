#!/bin/bash
# Extract all function declarations from real alpm.h and add to our header

REAL_HEADER="/home/orangepi/.local/share/opencode/tool-output/tool_ed86eb19c001Tbc6B4KaUd0olf"
OUR_HEADER="include/alpm.h"

echo "Extracting function declarations from real alpm.h..."
grep -oP '^\s*\w[\w\s\*]+\b(alpm_\w+)\s*\([^)]*\)\s*;' "$REAL_HEADER" > /tmp/full_funcs.txt
echo "Found $(wc -l < /tmp/full_funcs.txt) functions"

# Add the missing functions to our header (before the #endif)
echo "" >> "$OUR_HEADER"
echo "/* Extended function declarations from real libalpm */" >> "$OUR_HEADER"
cat /tmp/full_funcs.txt >> "$OUR_HEADER"
echo "Updated $OUR_HEADER"
