/* Hand-written stubs for libalpm functions not in libalpm.c */
#include "../include/alpm.h"
#include "../include/alpm_list.h"
#include <stdlib.h>
#include <string.h>

/* Option setters/getters not implemented */
int alpm_option_set_usesyslog(alpm_handle_t *h, int v) { (void)h; (void)v; return 0; }
int alpm_option_set_checkspace(alpm_handle_t *h, int v) { (void)h; (void)v; return 0; }
int alpm_option_set_default_siglevel(alpm_handle_t *h, int v) { (void)h; (void)v; return 0; }
int alpm_option_set_parallel_downloads(alpm_handle_t *h, int v) { (void)h; (void)v; return 0; }
int alpm_option_set_hookdirs(alpm_handle_t *h, void *v) { (void)h; (void)v; return 0; }
int alpm_option_set_noupgrades(alpm_handle_t *h, void *v) { (void)h; (void)v; return 0; }
int alpm_option_set_noextracts(alpm_handle_t *h, void *v) { (void)h; (void)v; return 0; }
int alpm_option_set_ignorepkgs(alpm_handle_t *h, void *v) { (void)h; (void)v; return 0; }
int alpm_option_set_ignoregroups(alpm_handle_t *h, void *v) { (void)h; (void)v; return 0; }
int alpm_option_set_overwrite_files(alpm_handle_t *h, void *v) { (void)h; (void)v; return 0; }
int alpm_option_set_sandboxuser(alpm_handle_t *h, const char *v) { (void)h; (void)v; return 0; }
int alpm_option_set_architectures(alpm_handle_t *h, void *v) { (void)h; (void)v; return 0; }
int alpm_option_set_assumeinstalled(alpm_handle_t *h, void *v) { (void)h; (void)v; return 0; }
int alpm_option_set_dlopen(alpm_handle_t *h, int v) { (void)h; (void)v; return 0; }
int alpm_option_set_lockfile(alpm_handle_t *h, const char *v) { (void)h; (void)v; return 0; }
int alpm_option_set_disable_sandbox_filesystem(alpm_handle_t *h, int v) { (void)h; (void)v; return 0; }
int alpm_option_set_disable_sandbox_syscalls(alpm_handle_t *h, int v) { (void)h; (void)v; return 0; }
int alpm_option_set_dlcb(alpm_handle_t *h, void *cb) { (void)h; (void)cb; }
int alpm_option_set_eventcb(alpm_handle_t *h, void *cb) { (void)h; (void)cb; }
int alpm_option_set_fetchcb(alpm_handle_t *h, void *cb) { (void)h; (void)cb; }
int alpm_option_set_logcb(alpm_handle_t *h, void *cb) { (void)h; (void)cb; }
int alpm_option_set_questioncb(alpm_handle_t *h, void *cb) { (void)h; (void)cb; }
int alpm_option_set_progresscb(alpm_handle_t *h, void *cb) { (void)h; (void)cb; }

/* Option getters */
int alpm_option_get_usesyslog(alpm_handle_t *h) { (void)h; return 0; }
int alpm_option_get_checkspace(alpm_handle_t *h) { (void)h; return 0; }
int alpm_option_get_default_siglevel(alpm_handle_t *h) { (void)h; return 0; }
int alpm_option_get_parallel_downloads(alpm_handle_t *h) { (void)h; return 0; }
int alpm_option_get_dlopen(alpm_handle_t *h) { (void)h; return 0; }
int alpm_option_get_dlopen_ctx(alpm_handle_t *h) { (void)h; return 0; }
int alpm_option_get_disable_sandbox_filesystem(alpm_handle_t *h) { (void)h; return 0; }
int alpm_option_get_disable_sandbox_syscalls(alpm_handle_t *h) { (void)h; return 0; }
void *alpm_option_get_dlcb(alpm_handle_t *h) { (void)h; return NULL; }
void *alpm_option_get_eventcb(alpm_handle_t *h) { (void)h; return NULL; }
void *alpm_option_get_fetchcb(alpm_handle_t *h) { (void)h; return NULL; }
void *alpm_option_get_logcb(alpm_handle_t *h) { (void)h; return NULL; }
void *alpm_option_get_questioncb(alpm_handle_t *h) { (void)h; return NULL; }
void *alpm_option_get_progresscb(alpm_handle_t *h) { (void)h; return NULL; }
void *alpm_option_get_dlcb_ctx(alpm_handle_t *h) { (void)h; return NULL; }
void *alpm_option_get_eventcb_ctx(alpm_handle_t *h) { (void)h; return NULL; }
void *alpm_option_get_fetchcb_ctx(alpm_handle_t *h) { (void)h; return NULL; }
void *alpm_option_get_logcb_ctx(alpm_handle_t *h) { (void)h; return NULL; }
void *alpm_option_get_questioncb_ctx(alpm_handle_t *h) { (void)h; return NULL; }
void *alpm_option_get_progresscb_ctx(alpm_handle_t *h) { (void)h; return NULL; }
const char *alpm_option_get_root(alpm_handle_t *h) { (void)h; return NULL; }
void *alpm_option_get_cachedirs(alpm_handle_t *h) { (void)h; return NULL; }
void *alpm_option_get_hookdirs(alpm_handle_t *h) { (void)h; return NULL; }
void *alpm_option_get_noupgrades(alpm_handle_t *h) { (void)h; return NULL; }
void *alpm_option_get_noextracts(alpm_handle_t *h) { (void)h; return NULL; }
void *alpm_option_get_ignorepkgs(alpm_handle_t *h) { (void)h; return NULL; }
void *alpm_option_get_ignoregroups(alpm_handle_t *h) { (void)h; return NULL; }
void *alpm_option_get_overwrite_files(alpm_handle_t *h) { (void)h; return NULL; }
void *alpm_option_get_sandboxuser(alpm_handle_t *h) { (void)h; return NULL; }
void *alpm_option_get_architectures(alpm_handle_t *h) { (void)h; return NULL; }
void *alpm_option_get_assumeinstalled(alpm_handle_t *h) { (void)h; return NULL; }

/* Option add/remove helpers */
int alpm_option_add_hookdir(alpm_handle_t *h, const char *d) { (void)h; (void)d; return 0; }
int alpm_option_add_architecture(alpm_handle_t *h, const char *a) { (void)h; (void)a; return 0; }
int alpm_option_add_assumeinstalled(alpm_handle_t *h, void *d) { (void)h; (void)d; return 0; }
int alpm_option_add_ignorepkg(alpm_handle_t *h, const char *p) { (void)h; (void)p; return 0; }
int alpm_option_add_ignoregroup(alpm_handle_t *h, const char *g) { (void)h; (void)g; return 0; }
int alpm_option_add_noupgrade(alpm_handle_t *h, const char *f) { (void)h; (void)f; return 0; }
int alpm_option_add_noextract(alpm_handle_t *h, const char *f) { (void)h; (void)f; return 0; }
int alpm_option_add_overwrite_file(alpm_handle_t *h, const char *f) { (void)h; (void)f; return 0; }
int alpm_option_remove_cachedir(alpm_handle_t *h, const char *d) { (void)h; (void)d; return 0; }
int alpm_option_remove_hookdir(alpm_handle_t *h, const char *d) { (void)h; (void)d; return 0; }
int alpm_option_remove_architecture(alpm_handle_t *h, const char *a) { (void)h; (void)a; return 0; }
int alpm_option_remove_assumeinstalled(alpm_handle_t *h, void *d) { (void)h; (void)d; return 0; }
int alpm_option_remove_ignorepkg(alpm_handle_t *h, const char *p) { (void)h; (void)p; return 0; }
int alpm_option_remove_ignoregroup(alpm_handle_t *h, const char *g) { (void)h; (void)g; return 0; }
int alpm_option_remove_noupgrade(alpm_handle_t *h, const char *f) { (void)h; (void)f; return 0; }
int alpm_option_remove_noextract(alpm_handle_t *h, const char *f) { (void)h; (void)f; return 0; }
int alpm_option_remove_overwrite_file(alpm_handle_t *h, const char *f) { (void)h; (void)f; return 0; }

/* Match helpers */
int alpm_option_match_noupgrade(alpm_handle_t *h, const char *f) { (void)h; (void)f; return 0; }
int alpm_option_match_noextract(alpm_handle_t *h, const char *f) { (void)h; (void)f; return 0; }

/* Database operations */
int alpm_db_update(alpm_handle_t *h, void *dbs, int force) { (void)h; (void)dbs; (void)force; return 0; }
void *alpm_db_search(alpm_db_t *db, void *needles) { (void)db; (void)needles; return NULL; }
int alpm_db_get_valid(alpm_db_t *db) { (void)db; return 1; }
const char *alpm_db_get_name(alpm_db_t *db) { (void)db; return "local"; }
void *alpm_db_get_groupcache(alpm_db_t *db) { (void)db; return NULL; }
void *alpm_db_get_group(alpm_db_t *db, const char *n) { (void)db; (void)n; return NULL; }
void *alpm_db_get_servers(alpm_db_t *db) { (void)db; return NULL; }
void *alpm_db_get_cache_servers(alpm_db_t *db) { (void)db; return NULL; }
int alpm_db_set_servers(alpm_db_t *db, void *s) { (void)db; (void)s; return 0; }
int alpm_db_set_cache_servers(alpm_db_t *db, void *s) { (void)db; (void)s; return 0; }
int alpm_db_set_usage(alpm_db_t *db, int u) { (void)db; (void)u; return 0; }
int alpm_db_get_usage(alpm_db_t *db) { (void)db; return 0; }
int alpm_db_get_siglevel(alpm_db_t *db) { (void)db; return 0; }
int alpm_db_check_pgp_signature(alpm_db_t *db) { (void)db; return 0; }
void *alpm_db_get_handle(alpm_db_t *db) { (void)db; return NULL; }
void *alpm_db_add_server(alpm_db_t *db, const char *s) { (void)db; (void)s; return NULL; }
void *alpm_db_add_cache_server(alpm_db_t *db, const char *s) { (void)db; (void)s; return NULL; }
void *alpm_db_remove_server(alpm_db_t *db, const char *s) { (void)db; (void)s; return NULL; }
void *alpm_db_remove_cache_server(alpm_db_t *db, const char *s) { (void)db; (void)s; return NULL; }

/* Package operations */
int alpm_pkg_load(alpm_handle_t *h, const char *fn, int f, int l, void **p) { (void)h; (void)fn; (void)f; (void)l; (void)p; return -1; }
int alpm_pkg_checkmd5sum(alpm_pkg_t *p) { (void)p; return 0; }
int alpm_fetch_pkgurl(alpm_handle_t *h, void *urls) { (void)h; (void)urls; return -1; }
void *alpm_find_group_pkgs(void *dbs, const char *n) { (void)dbs; (void)n; return NULL; }
void *alpm_checkdeps(alpm_handle_t *h, void *pkglist) { (void)h; (void)pkglist; return NULL; }
alpm_pkg_t *alpm_find_satisfier(alpm_list_t *pkgs, const char *dep) {
	if (!pkgs || !dep) return NULL;
	char depname[256];
	int i = 0;
	while (dep[i] && dep[i] != '<' && dep[i] != '>' && dep[i] != '=' && i < 255) {
		depname[i] = dep[i]; i++;
	}
	depname[i] = 0;
	alpm_list_t *it;
	for (it = pkgs; it; it = it->next) {
		alpm_pkg_t *p = (alpm_pkg_t *)it->data;
		if (p && strcmp(alpm_pkg_get_name(p), depname) == 0) return p;
	}
	return NULL;
}
alpm_pkg_t *alpm_find_dbs_satisfier(alpm_handle_t *h, alpm_list_t *dbs, const char *dep) {
	(void)h;
	if (!dbs || !dep) return NULL;
	alpm_list_t *it;
	for (it = dbs; it; it = it->next) {
		alpm_db_t *db = (alpm_db_t *)it->data;
		if (!db) continue;
		alpm_list_t *pkgs = alpm_db_get_pkgcache(db);
		alpm_pkg_t *found = alpm_find_satisfier(pkgs, dep);
		if (found) return found;
	}
	return NULL;
}
int alpm_checkconflicts(alpm_handle_t *h, void *pkglist) { (void)h; (void)pkglist; return 0; }
void *alpm_dep_from_string(const char *s) { (void)s; return NULL; }
const char *alpm_dep_compute_string(void *d) { (void)d; return NULL; }
void alpm_dep_free(void *d) { (void)d; }
void alpm_conflict_free(void *c) { (void)c; }
void alpm_fileconflict_free(void *c) { (void)c; }
void alpm_depmissing_free(void *m) { (void)m; }
void alpm_siglist_cleanup(void *s) { (void)s; }
int alpm_decode_signature(const char *b, unsigned char **d, size_t *l) { (void)b; (void)d; (void)l; return -1; }
int alpm_extract_keyid(alpm_handle_t *h, const char *id, const unsigned char *sig, size_t len, void **keys) { (void)h; (void)id; (void)sig; (void)len; (void)keys; return -1; }
int alpm_unlock(alpm_handle_t *h) { (void)h; return 0; }

/* Package property getters (some are already in libalpm.c - these cover the rest) */
const char *alpm_pkg_get_filename(alpm_pkg_t *p) { (void)p; return NULL; }
const char *alpm_pkg_get_base(alpm_pkg_t *p) { (void)p; return NULL; }
const char *alpm_pkg_get_packager(alpm_pkg_t *p) { (void)p; return NULL; }
const char *alpm_pkg_get_sha256sum(alpm_pkg_t *p) { (void)p; return NULL; }
void *alpm_pkg_get_backup(alpm_pkg_t *p) { (void)p; return NULL; }
void *alpm_pkg_get_files(alpm_pkg_t *p) { (void)p; return NULL; }
void *alpm_pkg_get_groups(alpm_pkg_t *p) { (void)p; return NULL; }
void *alpm_pkg_get_licenses(alpm_pkg_t *p) { (void)p; return NULL; }
void *alpm_pkg_get_depends(alpm_pkg_t *p) { (void)p; return NULL; }
void *alpm_pkg_get_optdepends(alpm_pkg_t *p) { (void)p; return NULL; }
void *alpm_pkg_get_conflicts(alpm_pkg_t *p) { (void)p; return NULL; }
void *alpm_pkg_get_provides(alpm_pkg_t *p) { (void)p; return NULL; }
void *alpm_pkg_get_replaces(alpm_pkg_t *p) { (void)p; return NULL; }
void *alpm_pkg_get_checkdepends(alpm_pkg_t *p) { (void)p; return NULL; }
void *alpm_pkg_get_makedepends(alpm_pkg_t *p) { (void)p; return NULL; }
void *alpm_pkg_get_xdata(alpm_pkg_t *p) { (void)p; return NULL; }
void *alpm_pkg_get_db(alpm_pkg_t *p) { (void)p; return NULL; }
void *alpm_pkg_get_handle(alpm_pkg_t *p) { (void)p; return NULL; }
alpm_pkg_t *alpm_pkg_find(void *list, const char *name) { (void)list; (void)name; return NULL; }
int alpm_pkg_should_ignore(alpm_handle_t *h, alpm_pkg_t *p) { (void)h; (void)p; return 0; }
int alpm_pkg_download_size(alpm_pkg_t *p) { (void)p; return 0; }
int alpm_filelist_contains(void *fl, const char *path) { (void)fl; (void)path; return 0; }
int alpm_pkg_changelog_open(alpm_pkg_t *p) { (void)p; return -1; }
int alpm_pkg_mtree_open(alpm_pkg_t *p) { (void)p; return -1; }
int alpm_pkg_mtree_next(alpm_pkg_t *p, void *entry) { (void)p; (void)entry; return 1; }
int alpm_pkg_mtree_close(alpm_pkg_t *p) { (void)p; return 0; }
int alpm_pkg_changelog_close(alpm_pkg_t *p) { (void)p; return 0; }
int alpm_pkg_changelog_read(void *ptr, size_t size, const alpm_pkg_t *p) { (void)ptr; (void)size; (void)p; return 0; }
int alpm_pkg_check_pgp_signature(alpm_pkg_t *p, void *sig) { (void)p; (void)sig; return -1; }
int alpm_pkg_compute_requiredby(alpm_pkg_t *p) { (void)p; return 0; }
int alpm_pkg_compute_optionalfor(alpm_pkg_t *p) { (void)p; return 0; }
int alpm_pkg_set_reason(alpm_handle_t *h, alpm_pkg_t *p, int r) { (void)h; (void)p; (void)r; return 0; }
void *alpm_sync_get_new_version(alpm_pkg_t *p, void *dbs) { (void)p; (void)dbs; return NULL; }
int alpm_compute_md5sum(const char *f, char **s) { (void)f; (void)s; return -1; }
int alpm_compute_sha256sum(const char *f, unsigned char **s) { (void)f; (void)s; return -1; }

/* Transaction operations */
int alpm_trans_interrupt(alpm_handle_t *h) { (void)h; return 0; }
int alpm_trans_get_flags(alpm_handle_t *h) { (void)h; return 0; }
void *alpm_trans_get_add(alpm_handle_t *h) { (void)h; return NULL; }
void *alpm_trans_get_remove(alpm_handle_t *h) { (void)h; return NULL; }
int alpm_unregister_all_syncdbs(alpm_handle_t *h) { (void)h; return 0; }
int alpm_sandbox_setup_child(alpm_handle_t *h, const char *u, const char *p, int r) { (void)h; (void)u; (void)p; (void)r; return 0; }
