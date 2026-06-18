#!/bin/bash
# Generate stubs for functions declared in header but not implemented in libalpm.c
HEADER="../include/alpm.h"
REAL="libalpm.c"
OUT="stubs.c"

grep -oP '^(static )?\w[\w\s\*]+\balpm_\w+\s*\(' "$REAL" | sed 's/.*\balpm_/alpm_/' | sed 's/(//' | sort > /tmp/defined.txt

count=0
while IFS= read -r line; do
    decl="${line%%(*}"
    name_with_star="${decl##* }"
    func_name="${name_with_star#\*}"
    raw_ret="${decl% $name_with_star}"
    ret_type="${raw_ret%"${raw_ret##*[! ]}"}"
    params="${line#*(}"; params="${params%);}"
    
    grep -qx "$func_name" /tmp/defined.txt 2>/dev/null && continue
    
    if   [[ "$ret_type" == "void" ]];            then body="{ }"
    elif [[ "$ret_type" == "int" ]];             then body="{ return 0; }"
    elif [[ "$ret_type" == "alpm_errno_t" ]];    then body="{ return ALPM_ERR_OK; }"
    elif [[ "$ret_type" == "off_t" || "$ret_type" == "alpm_time_t" || "$ret_type" == "size_t" ]]; then body="{ return 0; }"
    elif [[ "$ret_type" == "const char *" ]]     then body="{ return NULL; }"
    elif [[ "$ret_type" == *"*"* || "$name_with_star" == \** ]]; then body="{ return NULL; }"
    else body="{ return 0; }"
    fi
    
    lines+=("$ret_type $func_name($params) $body")
    ((count++))
done < <(grep -oP '^\s*\w[\w\s\*]+\b(alpm_\w+)\s*\([^)]*\)\s*;' "$HEADER")

cat > "$OUT" << EOF
/* Auto-generated stubs for functions not in libalpm.c */
#include "../include/alpm.h"
#include "../include/alpm_list.h"
#include <stdlib.h>
#include <string.h>

EOF

for l in "${lines[@]}"; do echo "$l" >> "$OUT"; done
echo "Generated $count stubs" >&2
