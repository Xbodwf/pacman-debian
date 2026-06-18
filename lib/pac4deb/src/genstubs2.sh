#!/bin/bash
HEADER="../include/alpm.h"
REAL="libalpm.c"
OUT="stubs.c"

grep -oP '^(static )?\w[\w\s\*]+\balpm_\w+\s*\(' "$REAL" | sed 's/.*\balpm_/alpm_/' | sed 's/(//' | sort > /tmp/defined_funcs.txt

echo '/* Auto-generated stubs */' > "$OUT"
echo '#include "../include/alpm.h"' >> "$OUT"
echo '#include "../include/alpm_list.h"' >> "$OUT"
echo '#include <stdlib.h>' >> "$OUT"
echo '#include <string.h>' >> "$OUT"
echo '' >> "$OUT"

count=0; skip=0
while IFS= read -r line; do
    decl="${line%%(*}"
    name_with_star="${decl##* }"
    func_name="${name_with_star#\*}"
    raw_ret="${decl% $name_with_star}"
    ret_type="${raw_ret%"${raw_ret##*[! ]}"}"
    params="${line#*(}"; params="${params%);}"
    
    grep -qx "$func_name" /tmp/defined_funcs.txt 2>/dev/null && { ((skip++)); continue; }
    
    [[ "$ret_type" == "void" ]]           && { body="{ }"; echo_ok; continue; }
    [[ "$ret_type" == "int" ]]            && { body="{ return 0; }"; echo_ok; continue; }
    [[ "$ret_type" == "alpm_errno_t" ]]   && { body="{ return ALPM_ERR_OK; }"; echo_ok; continue; }
    [[ "$ret_type" == "off_t" || "$ret_type" == "alpm_time_t" || "$ret_type" == "size_t" ]] && { body="{ return 0; }"; echo_ok; continue; }
    [[ "$ret_type" == "const char *" ]]   && { body="{ return NULL; }"; echo_ok; continue; }
    [[ "$ret_type" == *"*"* || "$name_with_star" == \** ]] && { body="{ return NULL; }"; echo_ok; continue; }
    
    # Unknown return type - use return 0
    body="{ return 0; }"
    echo_ok
    
done < <(grep -oP '^\s*\w[\w\s\*]+\b(alpm_\w+)\s*\([^)]*\)\s*;' "../include/alpm.h")

# Use a function to write to OUT
{
echo '/* Auto-generated stubs */'
echo '#include "../include/alpm.h"'
echo '#include "../include/alpm_list.h"'
echo '#include <stdlib.h>'
echo '#include <string.h>'
echo ''
} > "$OUT"

while IFS= read -r line; do
    decl="${line%%(*}"
    name_with_star="${decl##* }"
    func_name="${name_with_star#\*}"
    raw_ret="${decl% $name_with_star}"
    ret_type="${raw_ret%"${raw_ret##*[! ]}"}"
    params="${line#*(}"; params="${params%);}"
    
    grep -qx "$func_name" /tmp/defined_funcs.txt 2>/dev/null && continue
    
    if   [[ "$ret_type" == "void" ]];            then body="{ }"
    elif [[ "$ret_type" == "int" ]];             then body="{ return 0; }"
    elif [[ "$ret_type" == "alpm_errno_t" ]];    then body="{ return ALPM_ERR_OK; }"
    elif [[ "$ret_type" == "off_t" || "$ret_type" == "alpm_time_t" || "$ret_type" == "size_t" ]]; then body="{ return 0; }"
    elif [[ "$ret_type" == "const char *" ]]     then body="{ return NULL; }"
    elif [[ "$ret_type" == *"*"* || "$name_with_star" == \** ]]; then body="{ return NULL; }"
    else body="{ return 0; }"
    fi
    
    echo "$ret_type $func_name($params) $body" >> "$OUT"
    ((count++))
done < <(grep -oP '^\s*\w[\w\s\*]+\b(alpm_\w+)\s*\([^)]*\)\s*;' "../include/alpm.h")

echo "Generated $count stubs (skipped $skip)" >&2
