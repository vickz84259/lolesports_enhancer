src_dir := src
build_dir := builds

directories := css html img json js/external
src_dirs := $(foreach dir, $(directories), $(addprefix $(src_dir)/, $(dir)))
dest_dirs := $(build_dir) $(foreach dir, $(directories), $(addprefix $(build_dir)/, $(dir)))

src_files := $(src_dir)/manifest.json $(foreach dir, $(src_dirs), $(wildcard $(dir)/*))
dest_files := $(foreach file, $(src_files), $(subst $(src_dir)/, $(build_dir)/, $(file)))

js_modules_dir := $(src_dir)/js/modules
js_modules := $(wildcard $(js_modules_dir)/*) $(wildcard $(js_modules_dir)/**/*)

js_directories := background_scripts content_scripts internal
src_js_dirs := $(foreach dir, $(js_directories), $(addprefix $(src_dir)/js/, $(dir)))

src_js_files := $(foreach dir, $(src_js_dirs), $(wildcard $(dir)/*.js))
src_ts_files := $(foreach dir, $(src_js_dirs), $(wildcard $(dir)/*.ts))

dest_js_files := $(foreach file, $(src_js_files), $(subst $(src_dir)/, $(build_dir)/, $(file)))

temp_ts_files := $(foreach file, $(src_ts_files), $(subst $(src_dir)/, $(build_dir)/, $(file)))
dest_ts_files := $(foreach file, $(temp_ts_files), $(subst .ts,.js, $(file)))


zip_name := LoLEsportsEnhancer.zip


.PHONY: all static scripts build clean clean_install clean_build
all: build

lint: $(js_modules) $(src_js_files) $(src_ts_files)
	@npx eslint $(src_js_dirs) $(js_modules_dir) --ext .js --ext .ts --cache

$(dest_dirs):
	mkdir -p $@

$(dest_files): $(build_dir)/%: $(src_dir)/% | $(dest_dirs)
	cp $< $@

static: $(dest_files)

$(dest_ts_files) $(dest_js_files): $(js_modules)

$(dest_ts_files): $(build_dir)/%.js: $(src_dir)/%.ts
	@npx rollup -i $< -d $(dir $@) -f iife \
	-p typescript \
	-p node-resolve \

$(dest_js_files): $(build_dir)/%: $(src_dir)/%
	@npx rollup -i $< -d $(dir $@) -f iife \
	-p typescript \
	-p node-resolve \

scripts: $(dest_js_files) $(dest_ts_files)

$(zip_name): lint static scripts
	@cd $(build_dir) && zip -ruq $@ .

build: $(zip_name)

clean:
	rm $(build_dir)/* -r

clean_install: package-lock.json
	npm ci

clean_build: clean_install clean build