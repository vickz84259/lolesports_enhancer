src_dir := src
build_dir := builds

directories := css html img json js/external
src_dirs := $(foreach dir, $(directories), $(addprefix $(src_dir)/, $(dir)))
dest_dirs := $(build_dir) $(foreach dir, $(directories), $(addprefix $(build_dir)/, $(dir)))

src_files := $(src_dir)/manifest.json $(foreach dir, $(src_dirs), $(wildcard $(dir)/*))
# The file names without the source directory prefix
files := $(foreach file, $(src_files), $(subst $(src_dir)/,, $(file)))
dest_files := $(foreach file, $(files), $(addprefix $(build_dir)/, $(file)))

.PHONY: all static javascript build clean clean_install clean_build
all: build

static: $(dest_files)

$(dest_files): $(build_dir)/%: $(src_dir)/% | $(dest_dirs)
	cp $< $@

$(dest_dirs):
	mkdir -p $@

javascript:
	@npx rollup -c

clean:
	rm $(build_dir)/* -r

build: static javascript

clean_install: package-lock.json
	npm ci

clean_build: clean_install clean build