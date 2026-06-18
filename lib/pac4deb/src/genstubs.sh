#!/bin/bash
HEADER="../include/alpm.h"
REAL="libalpm.c"
OUT="stubs.c"

# Get all function names already defined in the real implementation
declare -A defined
while IFS= read -r line; do
    name=$(echo "$line" | grep -oP '\b(alpm_\w+)\b' | tail -1)
    [ -n "$name" ] && defined["$name"]=1
done < <(grep -oP '^(static )?\w[\w\s\*]+\balpm_\w+\s*\(' "$REAL")

echo '/* Auto-generated stubs for functions not in libalpm.c */' > "$OUT"
echo '#include "../include/alpm.h"' >> "$OUT"
echo '#include "../include/alpm_list.h"' >> "$OUT"
echo '#include <stdlib.h>' >> "$OUT"
echo '#include <string.h>' >> "$OUT"
echo '' >> "$OUT"

grep -oP '^\s*\w[\w\s\*]+\([^)]*\)\s*;' "$HEADER" | while read -r line; do
    func_name=$(echo "$line" | grep -oP '\b(alpm_\w+)\b' | tail -1)
    [ -z "$func_name" ] && continue
    [ -n "${defined[$func_name]}" ] && continue
    
    params=$(echo "$line" | sed 's/.*(\(.*\));/\1/')
    ret_type=$(echo "$line" | sed 's/\(.*\) \([a-zA-Z_][a-zA-Z_0-9]*\)(.*/\1/' | xargs)
    
    if [[ "$ret_type" == "void" ]]; then
        body="{ }"
    elif [[ "$ret_type" == *"*" ]]; then
        body="{ return NULL; }"
    elif [[ "$ret_type" == "int" ]]; then
        body="{ return 0; }"
    elif [[ "$ret_type" == "alpm_errno_t" ]]; then
        body="{ return ALPM_ERR_OK; }"
    elif [[ "$ret_type" == "off_t" ]] || [[ "$ret_type" == "alpm_time_t" ]] || [[ "$ret_type" == "size_t" ]]; then
        body="{ return 0; }"
    elif [[ "$ret_type" == "alpm_pkgreason_t" ]]; then
        body="{ return ALPM_PKG_REASON_EXPLICIT; }"
    elif [[ "$ret_type" == "alpm_pkgfrom_t" ]]; then
        body="{ return ALPM_PKG_FROM_LOCALDB; }"
    elif [[ "$ret_type" == "alpm_pkgvalidation_t" ]]; then
        body="{ return ALPM_PKG_VALIDATION_NONE; }"
    else
        body="{ return 0; }"
    fi
    
    printf "%s %s(%s) %s\n" "$ret_type" "$func_name" "$params" "$body" >> "$OUT"
done

echo "Generated $OUT with $(grep -c '^{' "$OUT") stubs"
