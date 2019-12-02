src_dir := src
build_dir := builds

directories := css html img json js/external
src_dirs := $(foreach dir, $(directories), $(addprefix $(src_dir)/, $(dir)))
dest_dirs := $(foreach dir, $(directories), $(addprefix $(build_dir)/, $(dir)))

src_files := $(foreach dir, $(src_dirs), $(wildcard $(dir)/*))
files := $(foreach file, $(src_files), $(subst $(src_dir)/,, $(file)))
dest_files := $(foreach file, $(files), $(addprefix $(build_dir)/, $(file)))

.PHONY: all static javascript
all: static javascript

static: $(build_dir)/manifest.json $(dest_files)

$(dest_files): builds/%: src/% | $(dest_dirs)
	cp $< $@

$(build_dir)/manifest.json: $(src_dir)/manifest.json | $(build_dir)
	cp $(src_dir)/manifest.json $(build_dir)/manifest.json

$(dest_dirs):
	@echo creating inner build directories
	@for dir in $(dest_dirs);\
	do \
		mkdir -p $$dir; \
	done

$(build_dir):
	@echo creating build directory
	@mkdir $(build_dir)

javascript:
	@rollup -c