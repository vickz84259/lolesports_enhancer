src_dir := src
build_dir := builds

directories := css html img json js/external
src_dirs := $(foreach dir, $(directories), $(addprefix $(src_dir)/, $(dir)))
dest_dirs := $(build_dir) $(foreach dir, $(directories), $(addprefix $(build_dir)/, $(dir)))

src_files := $(src_dir)/manifest.json $(foreach dir, $(src_dirs), $(wildcard $(dir)/*))
dest_files := $(foreach file, $(src_files), $(subst $(src_dir)/, $(build_dir)/, $(file)))

modules_dir := $(src_dir)/js/modules
modules := $(wildcard $(modules_dir)/*) $(wildcard $(modules_dir)/**/*)

ts_directories := background_scripts content_scripts internal
src_ts_dirs := $(foreach dir, $(ts_directories), $(addprefix $(src_dir)/js/, $(dir)))

src_ts_files := $(foreach dir, $(src_ts_dirs), $(wildcard $(dir)/*.ts))

dest_ts_files := $(foreach file, $(src_ts_files), $(subst $(src_dir)/, $(build_dir)/, $(file)))
dest_js_files := $(foreach file, $(dest_ts_files), $(subst .ts,.js, $(file)))

zip_name := LoLEsportsEnhancer.zip


.PHONY: all static scripts build clean clean_install clean_build
all: build

lint: $(modules) $(src_ts_files)
	@npx eslint $(src_ts_dirs) $(modules_dir) --ext .ts --cache

$(dest_dirs):
	mkdir -p $@

$(dest_files): $(build_dir)/%: $(src_dir)/% | $(dest_dirs)
	cp $< $@

static: $(dest_files)

$(dest_js_files): $(build_dir)/%.js: $(src_dir)/%.ts $(modules)
	@npx rollup -i $< -o $@ -f iife -p typescript -p node-resolve \
	-p "cleanup={comments: 'none'}"

scripts: $(dest_js_files)

$(zip_name): lint static scripts
	@cd $(build_dir) && zip -ruq $@ .

build: $(zip_name)

clean:
	rm $(build_dir)/* -r

clean_install: package-lock.json
	npm ci

clean_build: clean_install clean build